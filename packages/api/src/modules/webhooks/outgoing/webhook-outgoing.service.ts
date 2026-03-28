import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WebhookLogService } from '../webhook-log.service';
import * as crypto from 'crypto';
import axios from 'axios';

/**
 * Available webhook events for outgoing dispatch.
 * Ref: FR-055
 */
export type WebhookEvent =
  | 'user.registered'
  | 'user.login'
  | 'course.completed'
  | 'lesson.completed'
  | 'course.access.granted'
  | 'course.access.revoked';

@Injectable()
export class WebhookOutgoingService {
  private readonly logger = new Logger(WebhookOutgoingService.name);
  private readonly MAX_RETRIES = 3;
  /** Retry delays: 1min, 5min, 30min. Ref: FR-058 */
  private readonly RETRY_DELAYS = [60_000, 300_000, 1_800_000];

  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: WebhookLogService,
  ) {}

  /**
   * Emit a webhook event to all active configs subscribed to the event.
   * Ref: FR-054, FR-056
   */
  async emit(event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
    // Find all active webhook configs
    const configs = await this.prisma.webhookConfig.findMany({
      where: { active: true },
    });

    // Filter configs that include this event in their subscribed events
    const relevantConfigs = configs.filter((config) => {
      const events = config.events as string[];
      return Array.isArray(events) && events.includes(event);
    });

    // Fire-and-forget for each matching config
    for (const config of relevantConfigs) {
      this.sendWebhook(config, event, data).catch((error) => {
        this.logger.error(
          `Unhandled error sending webhook to ${config.url}: ${error.message}`,
        );
      });
    }
  }

  /**
   * Send a webhook to a specific config URL with HMAC signature and retry logic.
   * Ref: FR-056, FR-058
   */
  private async sendWebhook(
    config: { id: number; url: string; secret: string | null },
    event: string,
    data: Record<string, unknown>,
    attempt = 1,
  ): Promise<void> {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const logId = await this.logService.logOutgoing(event, payload, config.url);

    try {
      const body = JSON.stringify(payload);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add HMAC-SHA256 signature if secret is configured
      if (config.secret) {
        const signature = crypto
          .createHmac('sha256', config.secret)
          .update(body)
          .digest('hex');
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await axios.post(config.url, payload, {
        headers,
        timeout: 10_000,
      });

      await this.logService.updateStatus(
        logId,
        response.status,
        'Success',
        attempt,
      );
      this.logger.log(
        `Webhook sent: ${event} → ${config.url} (${response.status})`,
      );
    } catch (error) {
      const statusCode = (error as any).response?.status || 0;
      this.logger.error(
        `Webhook failed: ${event} → ${config.url} (attempt ${attempt}/${this.MAX_RETRIES})`,
      );
      await this.logService.updateStatus(
        logId,
        statusCode,
        error instanceof Error ? error.message : String(error),
        attempt,
      );

      // Retry with exponential backoff
      if (attempt < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAYS[attempt - 1];
        this.logger.log(
          `Scheduling retry ${attempt + 1} for ${config.url} in ${delay / 1000}s`,
        );
        setTimeout(() => {
          this.sendWebhook(config, event, data, attempt + 1).catch((err) => {
            this.logger.error(`Retry ${attempt + 1} unhandled error: ${err.message}`);
          });
        }, delay);
      }
    }
  }
}
