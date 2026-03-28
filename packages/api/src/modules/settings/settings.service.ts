import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  private cache: Map<string, string> = new Map();
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 60_000; // 60 seconds
  private readonly logger = new Logger(SettingsService.name);

  /**
   * Maps setting keys (DB/API) to their corresponding .env variable names.
   * Used for the fallback chain: DB -> .env -> hardcoded default.
   */
  private readonly ENV_FALLBACKS: Record<string, string> = {
    platform_name: 'PLATFORM_NAME',
    primary_color: 'PRIMARY_COLOR',
    logo_url: 'LOGO_URL',
    favicon_url: 'FAVICON_URL',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Get a single setting value.
   * Priority: DB (cached) -> .env -> null
   */
  async get(key: string): Promise<string | null> {
    await this.ensureCacheValid();

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const envKey = this.ENV_FALLBACKS[key];
    if (envKey) {
      return this.config.get<string>(envKey) ?? null;
    }

    return null;
  }

  /**
   * Get all white-label settings merged from .env defaults and DB overrides.
   * DB values take precedence over .env values.
   */
  async getAll(): Promise<Record<string, string>> {
    await this.ensureCacheValid();
    const result: Record<string, string> = {};

    // Start with .env defaults
    for (const [settingKey, envKey] of Object.entries(this.ENV_FALLBACKS)) {
      const envValue = this.config.get<string>(envKey);
      if (envValue !== undefined && envValue !== null) {
        result[settingKey] = envValue;
      }
    }

    // Override with DB values (higher precedence)
    for (const [key, value] of this.cache) {
      result[key] = value;
    }

    return result;
  }

  /**
   * Persist a setting to the database (upsert) and update the in-memory cache.
   */
  async set(key: string, value: string): Promise<void> {
    await this.prisma.platformSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    this.cache.set(key, value);
  }

  /**
   * Force a cache refresh on the next read.
   */
  async refresh(): Promise<void> {
    this.cacheTimestamp = 0;
    await this.ensureCacheValid();
  }

  /**
   * Reload the cache from the database if it has expired.
   * On DB errors, logs a warning and continues with stale cache / .env fallbacks.
   */
  private async ensureCacheValid(): Promise<void> {
    const now = Date.now();
    if (now - this.cacheTimestamp < this.CACHE_TTL) {
      return;
    }

    try {
      const settings = await this.prisma.platformSetting.findMany();
      this.cache.clear();
      for (const setting of settings) {
        this.cache.set(setting.key, setting.value);
      }
      this.cacheTimestamp = now;
    } catch (error) {
      this.logger.warn(
        'Failed to load settings from DB, using .env fallbacks',
        error instanceof Error ? error.message : error,
      );
    }
  }
}
