import { validate, EnvironmentVariables } from '../env.validation';

/**
 * Minimal set of required environment variables that pass validation.
 */
function validEnv(): Record<string, unknown> {
  return {
    DATABASE_URL: 'mysql://user:pass@localhost:3306/hmembers',
    JWT_SECRET: 'test-secret-key',
    JWT_EXPIRES_IN: '7d',
    ADMIN_EMAIL: 'admin@test.com',
    ADMIN_PASSWORD: 'securepassword',
    WEBHOOK_SECRET: 'webhook-secret',
  };
}

describe('env.validation', () => {
  describe('validate()', () => {
    it('should return validated config when all required variables are present', () => {
      const result = validate(validEnv());

      expect(result).toBeInstanceOf(EnvironmentVariables);
      expect(result.DATABASE_URL).toBe(
        'mysql://user:pass@localhost:3306/hmembers',
      );
      expect(result.JWT_SECRET).toBe('test-secret-key');
      expect(result.ADMIN_EMAIL).toBe('admin@test.com');
      expect(result.ADMIN_PASSWORD).toBe('securepassword');
      expect(result.WEBHOOK_SECRET).toBe('webhook-secret');
    });

    it('should apply default values for optional variables', () => {
      const result = validate(validEnv());

      expect(result.NODE_ENV).toBe('development');
      expect(result.PORT).toBe(3001);
      expect(result.JWT_EXPIRES_IN).toBe('7d');
      expect(result.MAX_SESSIONS).toBe(1);
      expect(result.UPLOAD_DIR).toBe('./uploads');
      expect(result.MAX_UPLOAD_SIZE).toBe(52428800);
      expect(result.SMTP_PORT).toBe(587);
      expect(result.PLATFORM_NAME).toBe('H-Members');
      expect(result.PRIMARY_COLOR).toBe('#6366F1');
      expect(result.LOGO_URL).toBe('');
      expect(result.FAVICON_URL).toBe('');
      expect(result.LICENSE_KEY).toBe('');
    });

    it('should override defaults when env values are provided', () => {
      const env = {
        ...validEnv(),
        PORT: '4000',
        NODE_ENV: 'production',
        MAX_SESSIONS: '3',
        PLATFORM_NAME: 'My Platform',
        PRIMARY_COLOR: '#FF0000',
        MAX_UPLOAD_SIZE: '104857600',
      };

      const result = validate(env);

      expect(result.PORT).toBe(4000);
      expect(result.NODE_ENV).toBe('production');
      expect(result.MAX_SESSIONS).toBe(3);
      expect(result.PLATFORM_NAME).toBe('My Platform');
      expect(result.PRIMARY_COLOR).toBe('#FF0000');
      expect(result.MAX_UPLOAD_SIZE).toBe(104857600);
    });

    it('should accept all valid NODE_ENV values', () => {
      for (const env of ['development', 'production', 'test']) {
        const result = validate({ ...validEnv(), NODE_ENV: env });
        expect(result.NODE_ENV).toBe(env);
      }
    });

    it('should accept optional SMTP variables', () => {
      const env = {
        ...validEnv(),
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: '465',
        SMTP_USER: 'user@gmail.com',
        SMTP_PASS: 'app-password',
        SMTP_FROM: 'noreply@test.com',
      };

      const result = validate(env);

      expect(result.SMTP_HOST).toBe('smtp.gmail.com');
      expect(result.SMTP_PORT).toBe(465);
      expect(result.SMTP_USER).toBe('user@gmail.com');
      expect(result.SMTP_PASS).toBe('app-password');
      expect(result.SMTP_FROM).toBe('noreply@test.com');
    });

    // --- Failure scenarios ---

    it('should throw when DATABASE_URL is missing', () => {
      const env = validEnv();
      delete env.DATABASE_URL;

      expect(() => validate(env)).toThrow('Environment validation failed');
      expect(() => validate(env)).toThrow('DATABASE_URL');
    });

    it('should throw when JWT_SECRET is missing', () => {
      const env = validEnv();
      delete env.JWT_SECRET;

      expect(() => validate(env)).toThrow('Environment validation failed');
      expect(() => validate(env)).toThrow('JWT_SECRET');
    });

    it('should throw when ADMIN_EMAIL is missing', () => {
      const env = validEnv();
      delete env.ADMIN_EMAIL;

      expect(() => validate(env)).toThrow('ADMIN_EMAIL');
    });

    it('should throw when ADMIN_PASSWORD is missing', () => {
      const env = validEnv();
      delete env.ADMIN_PASSWORD;

      expect(() => validate(env)).toThrow('ADMIN_PASSWORD');
    });

    it('should throw when WEBHOOK_SECRET is missing', () => {
      const env = validEnv();
      delete env.WEBHOOK_SECRET;

      expect(() => validate(env)).toThrow('WEBHOOK_SECRET');
    });

    it('should throw when NODE_ENV has an invalid value', () => {
      const env = { ...validEnv(), NODE_ENV: 'staging' };

      expect(() => validate(env)).toThrow('Environment validation failed');
      expect(() => validate(env)).toThrow('NODE_ENV');
    });

    it('should throw when PORT is not a valid number', () => {
      const env = { ...validEnv(), PORT: 'not-a-number' };

      expect(() => validate(env)).toThrow('PORT');
    });

    it('should throw when PORT is zero or negative', () => {
      const env = { ...validEnv(), PORT: '0' };

      expect(() => validate(env)).toThrow('PORT');
    });

    it('should throw when multiple required variables are missing', () => {
      const env = validEnv();
      delete env.DATABASE_URL;
      delete env.JWT_SECRET;

      expect(() => validate(env)).toThrow('DATABASE_URL');
      expect(() => validate(env)).toThrow('JWT_SECRET');
    });

    it('should not start without required variables (app boot guard)', () => {
      // Simulates an empty env — should fail with clear error
      expect(() => validate({})).toThrow('Environment validation failed');
    });
  });
});
