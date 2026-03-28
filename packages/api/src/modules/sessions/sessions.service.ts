import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);
  private readonly maxSessions: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.maxSessions = this.config.get<number>('MAX_SESSIONS', 1);
  }

  /**
   * Create a new session for the user.
   * If the user already has >= maxSessions active sessions,
   * invalidate the oldest ones to make room.
   */
  async createSession(
    userId: number,
    ip: string,
    userAgent: string,
  ): Promise<{ token: string; sessionsInvalidated: number }> {
    // Count active (non-expired) sessions
    const activeSessions = await this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'asc' },
    });

    let sessionsInvalidated = 0;

    // If at or over limit, remove oldest sessions
    if (activeSessions.length >= this.maxSessions) {
      const sessionsToRemove = activeSessions.slice(
        0,
        activeSessions.length - this.maxSessions + 1,
      );
      const idsToRemove = sessionsToRemove.map((s) => s.id);

      await this.prisma.session.deleteMany({
        where: { id: { in: idsToRemove } },
      });

      sessionsInvalidated = idsToRemove.length;
      this.logger.log(
        `Invalidated ${sessionsInvalidated} old session(s) for user ${userId}`,
      );
    }

    // Generate session token
    const token = randomBytes(32).toString('hex');

    // Parse JWT_EXPIRES_IN to calculate expiresAt
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '7d');
    const expiresAt = this.calculateExpiry(expiresIn);

    // Create new session
    await this.prisma.session.create({
      data: {
        userId,
        token,
        ip: ip || 'unknown',
        userAgent: userAgent || 'unknown',
        expiresAt,
      },
    });

    return { token, sessionsInvalidated };
  }

  /**
   * Validate that a session token is active and not expired.
   */
  async validateSession(userId: number, token: string): Promise<boolean> {
    const session = await this.prisma.session.findFirst({
      where: {
        userId,
        token,
        expiresAt: { gt: new Date() },
      },
    });
    return !!session;
  }

  /**
   * Remove a specific session (logout).
   */
  async removeSession(token: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { token },
    });
  }

  /**
   * Remove all sessions for a user (force logout everywhere).
   */
  async removeAllSessions(userId: number): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  /**
   * Cleanup expired sessions (called by cron or on-demand).
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired sessions`);
    }
    return result.count;
  }

  /**
   * Get active sessions for a user (admin view).
   */
  async getUserSessions(userId: number) {
    return this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        ip: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private calculateExpiry(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default to 7 days
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
}
