import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get app() {
    return {
      port: this.config.get<number>('PORT', 3001),
      nodeEnv: this.config.get<string>('NODE_ENV', 'development'),
      appUrl: this.config.get<string>('APP_URL', 'http://localhost'),
      corsOrigin: this.config.get<string>(
        'CORS_ORIGIN',
        'http://localhost:3000',
      ),
      licenseKey: this.config.get<string>('LICENSE_KEY', ''),
    };
  }

  get database() {
    return {
      url: this.config.getOrThrow<string>('DATABASE_URL'),
    };
  }

  get auth() {
    return {
      jwtSecret: this.config.getOrThrow<string>('JWT_SECRET'),
      jwtExpiresIn: this.config.get<string>('JWT_EXPIRES_IN', '7d'),
      adminEmail: this.config.getOrThrow<string>('ADMIN_EMAIL'),
      adminPassword: this.config.getOrThrow<string>('ADMIN_PASSWORD'),
      maxSessions: this.config.get<number>('MAX_SESSIONS', 1),
    };
  }

  get mail() {
    return {
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT', 587),
      user: this.config.get<string>('SMTP_USER'),
      pass: this.config.get<string>('SMTP_PASS'),
      from: this.config.get<string>('SMTP_FROM'),
    };
  }

  get whiteLabel() {
    return {
      platformName: this.config.get<string>('PLATFORM_NAME', 'H-Members'),
      primaryColor: this.config.get<string>('PRIMARY_COLOR', '#6366F1'),
      logoUrl: this.config.get<string>('LOGO_URL', ''),
      faviconUrl: this.config.get<string>('FAVICON_URL', ''),
    };
  }

  get storage() {
    return {
      uploadDir: this.config.get<string>('UPLOAD_DIR', './uploads'),
      maxUploadSize: this.config.get<number>('MAX_UPLOAD_SIZE', 52428800),
    };
  }

  get webhooks() {
    return {
      secret: this.config.getOrThrow<string>('WEBHOOK_SECRET'),
    };
  }

  get payments() {
    return {
      gateway: this.config.get<string>('PAYMENT_GATEWAY', 'none'), // 'stripe' | 'mercadopago' | 'none'
      stripe: {
        secretKey: this.config.get<string>('STRIPE_SECRET_KEY', ''),
        publishableKey: this.config.get<string>('STRIPE_PUBLISHABLE_KEY', ''),
        webhookSecret: this.config.get<string>('STRIPE_WEBHOOK_SECRET', ''),
      },
      mercadoPago: {
        accessToken: this.config.get<string>('MP_ACCESS_TOKEN', ''),
        publicKey: this.config.get<string>('MP_PUBLIC_KEY', ''),
        webhookSecret: this.config.get<string>('MP_WEBHOOK_SECRET', ''),
      },
      asaas: {
        apiKey: this.config.get<string>('ASAAS_API_KEY', ''),
        webhookToken: this.config.get<string>('ASAAS_WEBHOOK_TOKEN', ''),
        sandbox: this.config.get<string>('ASAAS_SANDBOX', 'true') === 'true',
      },
      successUrl: this.config.get<string>('PAYMENT_SUCCESS_URL', ''),
      cancelUrl: this.config.get<string>('PAYMENT_CANCEL_URL', ''),
    };
  }

  /** Whether SMTP is fully configured and email sending is available. */
  get isMailConfigured(): boolean {
    const { host, user, pass, from } = this.mail;
    return !!(host && user && pass && from);
  }
}
