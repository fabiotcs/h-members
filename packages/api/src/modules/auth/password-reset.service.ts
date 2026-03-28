import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config';
import { EmailService } from '../email/email.service';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Initiates the password reset flow.
   * Always returns success to prevent user enumeration (OWASP).
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Do not reveal whether the email exists
      this.logger.log(
        `Password reset requested for unknown email: ${email}`,
      );
      return;
    }

    // Invalidate any existing unused tokens for this user (AC-12)
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Build reset URL using CORS_ORIGIN as frontend base URL
    const frontendUrl = this.appConfig.app.corsOrigin;
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const platformName = this.appConfig.whiteLabel.platformName;

    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetUrl,
      platformName,
    );

    this.logger.log(`Password reset token generated for user ${user.id}`);
  }

  /**
   * Resets the user's password using a valid token.
   * Invalidates all active sessions after reset (AC-8).
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Token invalido ou expirado.');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('Token invalido ou expirado.');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token invalido ou expirado.');
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Use a transaction to ensure atomicity
    await this.prisma.$transaction([
      // Update user password
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),

      // Mark token as used (AC-6)
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),

      // Invalidate all active sessions for this user (AC-8)
      this.prisma.session.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    this.logger.log(
      `Password reset completed for user ${resetToken.userId}`,
    );
  }
}
