import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { AppConfigService } from '../../config';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  sessionId: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
  ) {}

  /**
   * Validates user credentials (email + password).
   * Returns the user without passwordHash, or throws UnauthorizedException.
   * AC-7: Returns generic "Credenciais invalidas" without revealing which field failed.
   * AC-11: Users with INACTIVE status receive 403.
   */
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    if (user.status === 'INACTIVE') {
      throw new ForbiddenException(
        'Conta desativada. Entre em contato com o administrador.',
      );
    }

    const { passwordHash: _, ...result } = user;
    return result;
  }

  /**
   * Creates a session in the DB (with MAX_SESSIONS enforcement via SessionsService)
   * and generates a JWT token.
   * AC-3: JWT payload contains { sub, role, sessionId }.
   */
  async login(
    user: { id: number; email: string; role: string },
    ip?: string,
    userAgent?: string,
  ) {
    // Delegate session creation to SessionsService (handles MAX_SESSIONS)
    const { token: sessionToken, sessionsInvalidated } =
      await this.sessionsService.createSession(
        user.id,
        ip ?? 'unknown',
        userAgent ?? 'unknown',
      );

    if (sessionsInvalidated > 0) {
      this.logger.log(
        `User ${user.email}: ${sessionsInvalidated} old session(s) invalidated`,
      );
    }

    // Find the session we just created by its token to get the session ID
    const session = await this.prisma.session.findFirst({
      where: { userId: user.id, token: sessionToken },
      select: { id: true },
    });

    const sessionId = session?.id ?? 0;

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload);

    // Update session record with the actual JWT (for reference/revocation)
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { token: accessToken },
    });

    this.logger.log(`User ${user.email} logged in (session ${sessionId})`);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Deletes a session from the database (logout).
   * AC-5: Invalidates the session in DB and clears the cookie.
   */
  async logout(sessionId: number) {
    try {
      await this.prisma.session.delete({
        where: { id: sessionId },
      });
      this.logger.log(`Session ${sessionId} deleted (logout)`);
    } catch {
      // Session may already be deleted — not an error
      this.logger.warn(`Session ${sessionId} not found during logout`);
    }
  }

  /**
   * Validates that a session exists in the DB and is not expired.
   * Called by JwtStrategy on every authenticated request.
   */
  async validateSession(userId: number, sessionId: number): Promise<boolean> {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        expiresAt: { gt: new Date() },
      },
    });

    return session !== null;
  }

  /**
   * Returns user profile by ID.
   * AC-6: Returns { id, name, email, role, status }.
   */
  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado');
    }

    return user;
  }
}
