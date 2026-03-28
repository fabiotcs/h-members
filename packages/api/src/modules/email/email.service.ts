import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initTransporter();
  }

  private initTransporter() {
    if (!this.appConfig.isMailConfigured) {
      this.logger.warn('SMTP not configured — email sending disabled');
      return;
    }

    const { host, port, user, pass } = this.appConfig.mail;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    platformName: string,
  ): Promise<void> {
    const html = this.getPasswordResetTemplate(resetUrl, platformName);
    await this.sendEmail(
      to,
      `Recuperar senha - ${platformName}`,
      html,
      'PASSWORD_RESET',
    );
  }

  async sendWelcomeEmail(
    to: string,
    name: string,
    password: string,
    loginUrl: string,
    platformName: string,
  ): Promise<void> {
    const html = this.getWelcomeTemplate(
      name,
      to,
      password,
      loginUrl,
      platformName,
    );
    await this.sendEmail(
      to,
      `Bem-vindo(a) a ${platformName}`,
      html,
      'WELCOME',
    );
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    type: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Cannot send email to ${to} — SMTP not configured`);
      await this.logEmail(to, type, 'FAILED', 'SMTP not configured');
      return;
    }

    try {
      const from = this.appConfig.mail.from ?? 'noreply@hmembers.com';
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Email sent: ${type} to ${to}`);
      await this.logEmail(to, type, 'SENT');
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      await this.logEmail(to, type, 'FAILED', error instanceof Error ? error.message : String(error));
    }
  }

  private async logEmail(
    to: string,
    type: string,
    status: string,
    error?: string,
  ) {
    try {
      await this.prisma.emailLog.create({
        data: {
          to,
          type: type as any,
          status: status as any,
          error,
        },
      });
    } catch (e) {
      this.logger.error('Failed to log email:', e);
    }
  }

  private getPasswordResetTemplate(
    resetUrl: string,
    platformName: string,
  ): string {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; padding: 40px 0;">
      <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h2 style="color: #18181b; margin-bottom: 16px;">Recuperar Senha</h2>
        <p style="color: #52525b; line-height: 1.6;">
          Voce solicitou a recuperacao de senha na plataforma <strong>${platformName}</strong>.
          Clique no botao abaixo para criar uma nova senha. Este link expira em <strong>1 hora</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Redefinir Senha
          </a>
        </div>
        <p style="color: #a1a1aa; font-size: 13px;">
          Se voce nao solicitou essa alteracao, ignore este e-mail.
        </p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #a1a1aa; font-size: 12px; text-align: center;">${platformName}</p>
      </div>
    </body>
    </html>`;
  }

  private getWelcomeTemplate(
    name: string,
    email: string,
    password: string,
    loginUrl: string,
    platformName: string,
  ): string {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; padding: 40px 0;">
      <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h2 style="color: #18181b; margin-bottom: 16px;">Bem-vindo(a), ${name}!</h2>
        <p style="color: #52525b; line-height: 1.6;">
          Sua conta foi criada na plataforma <strong>${platformName}</strong>. Aqui estao seus dados de acesso:
        </p>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #18181b;"><strong>E-mail:</strong> ${email}</p>
          <p style="margin: 4px 0; color: #18181b;"><strong>Senha:</strong> ${password}</p>
        </div>
        <p style="color: #ef4444; font-size: 13px;">Recomendamos que voce altere sua senha apos o primeiro login.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #6366f1; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Acessar Plataforma
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #a1a1aa; font-size: 12px; text-align: center;">${platformName}</p>
      </div>
    </body>
    </html>`;
  }
}
