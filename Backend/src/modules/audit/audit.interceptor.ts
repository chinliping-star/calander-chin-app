import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { AuditService } from './audit.service';

/**
 * Logs every mutating (POST/PATCH/PUT/DELETE) admin request to the audit trail
 * after it succeeds. GET requests are ignored to avoid noise.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { clerkUserId?: string }>();
    const res = context.switchToHttp().getResponse<Response>();
    const method = req.method.toUpperCase();
    const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);

    return next.handle().pipe(
      tap(() => {
        if (!isMutation) return;
        this.audit.record({
          clerkId: req.clerkUserId ?? '',
          method,
          path: req.originalUrl ?? req.url,
          status: res.statusCode,
        }).catch(() => {});
      }),
    );
  }
}
