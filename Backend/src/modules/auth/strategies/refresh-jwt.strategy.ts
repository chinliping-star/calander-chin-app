import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.['refresh_token'] ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.username) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { sub: payload.sub, username: payload.username };
  }
}
