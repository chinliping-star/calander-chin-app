import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { clerkUserId?: string }>();
    const authHeader = req.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) return true;

    const token = authHeader.slice(7);
    try {
      const payload = await verifyToken(token, {
        secretKey: this.config.get<string>('CLERK_SECRET_KEY')!,
      });
      req.clerkUserId = payload.sub;
    } catch {
      // invalid token — treat as guest
    }
    return true;
  }
}
