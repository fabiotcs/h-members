import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @IsOptional()
  PORT: number = 3001;

  // Database — single connection string used by Prisma
  @IsString()
  DATABASE_URL: string;

  // Auth
  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  @IsString()
  ADMIN_EMAIL: string;

  @IsString()
  ADMIN_PASSWORD: string;

  // Webhooks
  @IsString()
  WEBHOOK_SECRET: string;

  // Sessions
  @IsNumber()
  @Min(1)
  @IsOptional()
  MAX_SESSIONS: number = 1;

  // Storage
  @IsString()
  @IsOptional()
  UPLOAD_DIR: string = './uploads';

  @IsNumber()
  @Min(1)
  @IsOptional()
  MAX_UPLOAD_SIZE: number = 52428800; // 50 MB in bytes

  // SMTP (all optional — system starts without email configured)
  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsNumber()
  @IsOptional()
  SMTP_PORT: number = 587;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASS?: string;

  @IsString()
  @IsOptional()
  SMTP_FROM?: string;

  // White Label — defaults overridable via PlatformSetting table
  @IsString()
  @IsOptional()
  PLATFORM_NAME: string = 'H-Members';

  @IsString()
  @IsOptional()
  PRIMARY_COLOR: string = '#6366F1';

  @IsString()
  @IsOptional()
  LOGO_URL: string = '';

  @IsString()
  @IsOptional()
  FAVICON_URL: string = '';

  // License (optional — validation logic is a future story)
  @IsString()
  @IsOptional()
  LICENSE_KEY: string = '';

  // CORS
  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:3000';

  // Payment Gateway (optional — system starts without payments configured)
  @IsString()
  @IsOptional()
  PAYMENT_GATEWAY: string = 'none';

  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_PUBLISHABLE_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string;

  @IsString()
  @IsOptional()
  MP_ACCESS_TOKEN?: string;

  @IsString()
  @IsOptional()
  MP_PUBLIC_KEY?: string;

  @IsString()
  @IsOptional()
  MP_WEBHOOK_SECRET?: string;

  @IsString()
  @IsOptional()
  ASAAS_API_KEY?: string;

  @IsString()
  @IsOptional()
  ASAAS_WEBHOOK_TOKEN?: string;

  @IsString()
  @IsOptional()
  ASAAS_SANDBOX: string = 'true';

  @IsString()
  @IsOptional()
  PAYMENT_SUCCESS_URL: string = '';

  @IsString()
  @IsOptional()
  PAYMENT_CANCEL_URL: string = '';
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors.map((err) => {
      const constraints = err.constraints
        ? Object.values(err.constraints).join(', ')
        : 'unknown error';
      return `  - ${err.property}: ${constraints}`;
    });

    throw new Error(
      `Environment validation failed:\n${messages.join('\n')}\n\nCheck your .env file and ensure all required variables are set.`,
    );
  }

  return validatedConfig;
}
