import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Request } from 'express';
import { User, UserDocument } from '../users/schemas/user.schema';
import { isEffectiveAdmin } from './admin-access';

/**
 * Allows the request only if the authenticated user is an admin.
 * Admin = email present in the ADMIN_EMAILS env allowlist (comma-separated),
 * or the user's is_admin flag is set. Runs AFTER JwtAuthGuard, which sets
 * req.clerkUserId.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { clerkUserId?: string }>();
    const clerkId = req.clerkUserId;
    if (!clerkId) throw new ForbiddenException('Not authenticated');

    const user = await this.userModel
      .findOne({ clerk_id: clerkId })
      .select('email is_admin')
      .lean()
      .exec();
    if (!user) throw new ForbiddenException('User not found');

    if (!isEffectiveAdmin(user, this.config.get<string>('ADMIN_EMAILS'))) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
