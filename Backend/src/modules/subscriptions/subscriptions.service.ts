import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class SubscriptionsService {
  private stripe: InstanceType<typeof Stripe>;

  constructor(
    @InjectModel(Subscription.name) private readonly subModel:  Model<SubscriptionDocument>,
    @InjectModel(User.name)         private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {
    const key = this.configService.get<string>('STRIPE_SECRET_KEY', '');
    if (key) {
      this.stripe = new Stripe(key, { apiVersion: '2026-05-27.dahlia' });
    }
  }

  private async resolveUser(clerkId: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private requireStripe() {
    if (!this.stripe) throw new BadRequestException('Stripe not configured — add STRIPE_SECRET_KEY to .env');
  }

  async createCheckout(clerkId: string, plan: 'monthly' | 'yearly'): Promise<{ url: string }> {
    this.requireStripe();
    const user = await this.resolveUser(clerkId);
    const priceId = plan === 'monthly'
      ? this.configService.get<string>('STRIPE_MONTHLY_PRICE_ID', '')
      : this.configService.get<string>('STRIPE_YEARLY_PRICE_ID', '');

    const clientUrl = this.configService.get<string>('CLIENT_URL', 'http://localhost:5173');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${clientUrl}/settings?premium=success`,
      cancel_url:  `${clientUrl}/pricing?cancelled=1`,
      metadata: {
        clerkUserId: clerkId,
        plan,
        mongoUserId: (user._id as Types.ObjectId).toString(),
      },
      customer_email: user.email,
    });

    return { url: session.url! };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    this.requireStripe();
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      await this.handleCheckoutComplete(session);
    } else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const sub = event.data.object as any;
      await this.handleSubscriptionChange(sub);
    }
  }

  private async handleCheckoutComplete(session: any): Promise<void> {
    const { clerkUserId, plan, mongoUserId } = session.metadata ?? {};
    if (!mongoUserId || !clerkUserId) return;

    const stripeSub = await this.stripe.subscriptions.retrieve(session.subscription as string) as any;

    await this.subModel.findOneAndUpdate(
      { user_id: new Types.ObjectId(mongoUserId) },
      {
        $set: {
          plan,
          status: 'active',
          stripe_customer_id:     session.customer as string,
          stripe_subscription_id: session.subscription as string,
          current_period_start:   new Date(stripeSub.current_period_start * 1000),
          current_period_end:     new Date(stripeSub.current_period_end   * 1000),
        },
      },
      { upsert: true, new: true },
    ).exec();

    await this.userModel.findByIdAndUpdate(mongoUserId, { $set: { is_premium: true } }).exec();
  }

  private async handleSubscriptionChange(stripeSub: any): Promise<void> {
    const record = await this.subModel.findOne({ stripe_subscription_id: stripeSub.id }).exec();
    if (!record) return;

    const isCancelled = stripeSub.status === 'canceled' || stripeSub.cancel_at_period_end;

    await this.subModel.findByIdAndUpdate(record._id, {
      $set: {
        status: isCancelled ? 'cancelled' : 'active',
        current_period_end: new Date(stripeSub.current_period_end * 1000),
      },
    }).exec();

    if (stripeSub.status === 'canceled') {
      await this.userModel.findByIdAndUpdate(record.user_id, { $set: { is_premium: false } }).exec();
    }
  }

  async getMe(clerkId: string): Promise<SubscriptionDocument | null> {
    const user = await this.resolveUser(clerkId);
    return this.subModel.findOne({ user_id: user._id }).exec();
  }

  async cancel(clerkId: string): Promise<void> {
    this.requireStripe();
    const user = await this.resolveUser(clerkId);
    const sub  = await this.subModel.findOne({ user_id: user._id, status: 'active' }).exec();
    if (!sub) throw new NotFoundException('No active subscription');

    await this.stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await this.subModel.findByIdAndUpdate(sub._id, { $set: { status: 'cancelled' } }).exec();
  }
}
