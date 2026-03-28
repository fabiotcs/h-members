import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AppConfigService } from '../../../config';
import { AuthService, JwtPayload } from '../auth.service';

/**
 * Extracts JWT from httpOnly cookie 'access_token' (primary)
 * or Authorization Bearer header (fallback for API clients).
 */
function extractJwtFromCookieOrHeader(req: Request): string | null {
  // Primary: cookie
  if (req.cookies && req.cookies['access_token']) {
    return req.cookies['access_token'];
  }

  // Fallback: Authorization header
  const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (fromHeader) {
    return fromHeader;
  }

  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: extractJwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: appConfig.auth.jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const isSessionValid = await this.authService.validateSession(
      payload.sub,
      payload.sessionId,
    );

    if (!isSessionValid) {
      throw new UnauthorizedException('Sessao invalida ou expirada');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  }
}
