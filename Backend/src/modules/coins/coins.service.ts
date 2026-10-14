import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CoinTransaction, CoinTransactionDocument, CoinReason } from './schemas/coin-transaction.schema';

/** How many coins each action earns. */
export const COIN_RULES: Record<'friend_added' | 'post_created' | 'post_photo' | 'memory_photo', number> = {
  friend_added: 20,
  post_created: 5,
  post_photo: 10,
  memory_photo: 10,
};

/** Posts / photos only earn this many times per day (stops spam farming). */
const DAILY_CAP = 10;

/** What coins can buy. */
export const COIN_REWARDS = {
  premium_month: { cost: 500, days: 30, label: '30 days of Premium' },
} as const;
export type CoinReward = keyof typeof COIN_REWARDS;

@Injectable()
export class CoinsService {
  private readonly log = new Logger(CoinsService.name);

  constructor(
    @InjectModel(User.name)            private readonly userModel: Model<UserDocument>,
    @InjectModel(CoinTransaction.name) private readonly txModel: Model<CoinTransactionDocument>,
  ) {}

  private async resolveUser(clerkId: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ clerk_id: clerkId, deleted_at: null }).exec();
    if (!user) throw new NotFoundException('User profile not found');
    return user;
  }

  /**
   * Pay coins for an action. Never throws — earning must not break the action
   * that triggered it. Returns the coins given (0 if capped or already paid).
   */
  async award(userId: Types.ObjectId, reason: keyof typeof COIN_RULES, ref: string): Promise<number> {
    try {
      const user = await this.userModel.findById(userId).select('status deleted_at').lean().exec();
      if (!user || user.deleted_at || user.status !== 'active') return 0;

      if (reason !== 'friend_added') {
        const since = new Date();
        since.setHours(0, 0, 0, 0);
        const today = await this.txModel.countDocuments({ user_id: userId, reason, created_at: { $gte: since } }).exec();
        if (today >= DAILY_CAP) return 0;
      }

      const amount = COIN_RULES[reason];
      await this.txModel.create({ user_id: userId, amount, reason, ref });
      await this.userModel.updateOne({ _id: userId }, { $inc: { coins: amount } }).exec();
      return amount;
    } catch (err) {
      // Duplicate key = this ref already paid out. Anything else: log only.
      if ((err as { code?: number }).code !== 11000) this.log.warn(`award ${reason} failed: ${(err as Error).message}`);
      return 0;
    }
  }

  /** Stable key for a friendship, so unfriend + re-add doesn't pay again. */
  static friendRef(a: Types.ObjectId, b: Types.ObjectId): string {
    return [a.toString(), b.toString()].sort().join(':');
  }

  async getMine(clerkId: string) {
    const user = await this.resolveUser(clerkId);
    await this.expireCoinPremium(user);
    const history = await this.txModel
      .find({ user_id: user._id })
      .sort({ created_at: -1 })
      .limit(30)
      .select('amount reason note created_at')
      .lean()
      .exec();
    return {
      balance: user.coins ?? 0,
      premium_until: user.premium_source === 'coins' ? user.premium_until : null,
      rules: COIN_RULES,
      daily_cap: DAILY_CAP,
      rewards: COIN_REWARDS,
      history,
    };
  }

  /** Spend coins on a reward. Atomic: the balance check and deduction are one update. */
  async redeem(clerkId: string, reward: CoinReward) {
    const item = COIN_REWARDS[reward];
    if (!item) throw new BadRequestException('Unknown reward');
    const user = await this.resolveUser(clerkId);
    await this.expireCoinPremium(user);

    // A paid (Stripe) or admin-granted premium already covers this.
    if (user.is_premium && user.premium_source !== 'coins') {
      throw new BadRequestException('You already have Premium');
    }

    const updated = await this.userModel
      .findOneAndUpdate({ _id: user._id, coins: { $gte: item.cost } }, { $inc: { coins: -item.cost } }, { new: true })
      .exec();
    if (!updated) throw new BadRequestException(`You need ${item.cost} coins for this`);

    // Stack on top of any coin premium still running.
    const base = updated.premium_until && updated.premium_until > new Date() ? updated.premium_until : new Date();
    const until = new Date(base.getTime() + item.days * 86_400_000);
    updated.is_premium = true;
    updated.premium_source = 'coins';
    updated.premium_until = until;
    await updated.save();

    await this.txModel.create({ user_id: user._id, amount: -item.cost, reason: 'redeem_premium', note: item.label });
    return { balance: updated.coins, premium_until: until };
  }

  /** Coin-bought premium ends when its days run out (checked lazily). */
  async expireCoinPremium(user: UserDocument): Promise<void> {
    if (user.premium_source === 'coins' && user.premium_until && user.premium_until <= new Date() && user.is_premium) {
      user.is_premium = false;
      user.premium_source = null;
      await user.save();
    }
  }

  /** Admin grant (+) or deduction (-). Balance never goes below zero. */
  async adminAdjust(userId: string, amount: number, note: string) {
    if (!Number.isInteger(amount) || amount === 0) throw new BadRequestException('Amount must be a whole number, not 0');
    const _id = new Types.ObjectId(userId);
    const filter = amount < 0 ? { _id, coins: { $gte: -amount } } : { _id };
    const updated = await this.userModel.findOneAndUpdate(filter, { $inc: { coins: amount } }, { new: true }).exec();
    if (!updated) {
      const exists = await this.userModel.exists({ _id });
      if (!exists) throw new NotFoundException('User not found');
      throw new BadRequestException('User does not have that many coins');
    }
    await this.txModel.create({ user_id: _id, amount, reason: 'admin_adjust' as CoinReason, note });
    return { balance: updated.coins };
  }

  /** Coin economy numbers for the admin dashboard. */
  async stats() {
    const [circulating, earned, spent] = await Promise.all([
      this.userModel.aggregate([{ $match: { deleted_at: null } }, { $group: { _id: null, sum: { $sum: '$coins' } } }]).exec(),
      this.txModel.aggregate([{ $match: { amount: { $gt: 0 } } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]).exec(),
      this.txModel.aggregate([{ $match: { reason: 'redeem_premium' } }, { $group: { _id: null, sum: { $sum: '$amount' }, n: { $sum: 1 } } }]).exec(),
    ]);
    return {
      circulating: circulating[0]?.sum ?? 0,
      earned: earned[0]?.sum ?? 0,
      redeemed: Math.abs(spent[0]?.sum ?? 0),
      redemptions: spent[0]?.n ?? 0,
    };
  }

  /** Most coins earned in the last `days` — the "good users" leaderboard. */
  async topEarners(days = 30, limit = 10) {
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await this.txModel.aggregate([
      { $match: { created_at: { $gte: since }, amount: { $gt: 0 }, reason: { $ne: 'admin_adjust' } } },
      { $group: { _id: '$user_id', earned: { $sum: '$amount' }, actions: { $sum: 1 } } },
      { $sort: { earned: -1 } },
      { $limit: limit },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $match: { 'user.deleted_at': null } },
      {
        $project: {
          _id: 0, earned: 1, actions: 1,
          user: { _id: '$user._id', username: '$user.username', display_name: '$user.display_name', avatar_url: '$user.avatar_url', coins: '$user.coins', is_trusted: '$user.is_trusted', status: '$user.status' },
        },
      },
    ]).exec();
    return rows;
  }
}
