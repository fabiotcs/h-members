import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { WebhookLogService } from '../webhook-log.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export interface IncomingWebhookPayload {
  event: string;
  timestamp?: string;
  customer: {
    email: string;
    name: string;
    phone?: string;
  };
  product: {
    external_id: string;
    name: string;
  };
  transaction?: {
    id: string;
    amount: number;
    currency: string;
  };
}

@Injectable()
export class WebhookIncomingService {
  private readonly logger = new Logger(WebhookIncomingService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly logService: WebhookLogService,
  ) {
    this.webhookSecret = this.config.get<string>('WEBHOOK_SECRET', '');
  }

  /**
   * Validate webhook signature using HMAC-SHA256 or direct secret comparison.
   * Ref: FR-053
   */
  validateSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('WEBHOOK_SECRET not configured — skipping validation');
      return true;
    }

    // Try HMAC-SHA256 validation first
    const expectedHmac = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) {
      return true;
    }

    // Fallback: direct secret comparison (X-Webhook-Secret header)
    try {
      if (
        signature.length === this.webhookSecret.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(this.webhookSecret))
      ) {
        return true;
      }
    } catch {
      // Length mismatch — not a direct secret match
    }

    return false;
  }

  /**
   * Process an incoming sale webhook.
   * Creates user if needed and grants course access.
   * Ref: FR-050, FR-051, FR-052
   */
  async processSaleWebhook(
    payload: IncomingWebhookPayload,
    rawBody: string,
    signature: string,
  ) {
    // Log the incoming webhook
    const logId = await this.logService.logIncoming(payload.event, payload);

    try {
      // Validate signature
      if (!this.validateSignature(rawBody, signature)) {
        await this.logService.updateStatus(logId, 401, 'Invalid signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }

      // Validate event type
      if (
        payload.event !== 'sale.confirmed' &&
        payload.event !== 'purchase.approved'
      ) {
        await this.logService.updateStatus(logId, 200, 'Event ignored');
        return { message: 'Event ignored', event: payload.event };
      }

      // Find or create user
      let user = await this.prisma.user.findUnique({
        where: { email: payload.customer.email },
      });

      let generatedPassword: string | null = null;

      if (!user) {
        // Generate random password
        generatedPassword = crypto.randomBytes(8).toString('hex');
        const passwordHash = await bcrypt.hash(generatedPassword, 10);

        user = await this.prisma.user.create({
          data: {
            email: payload.customer.email,
            name: payload.customer.name,
            passwordHash,
            role: 'STUDENT',
            status: 'ACTIVE',
          },
        });

        this.logger.log(`Created new user: ${user.email}`);

        // TODO: Send welcome email with credentials via EmailModule
      }

      // Find course by external_id or name match
      // First try salesUrl containing external_id, then by title
      const course = await this.prisma.course.findFirst({
        where: {
          OR: [
            { salesUrl: { contains: payload.product.external_id } },
            { title: payload.product.name },
          ],
        },
      });

      if (!course) {
        this.logger.warn(
          `Course not found for product: ${payload.product.external_id} / ${payload.product.name}`,
        );
        await this.logService.updateStatus(logId, 200, 'Course not found');
        return {
          message: 'User created but course not found',
          userId: user.id,
        };
      }

      // Grant course access (idempotent — upsert)
      await this.prisma.courseAccess.upsert({
        where: {
          userId_courseId: { userId: user.id, courseId: course.id },
        },
        update: {},
        create: {
          userId: user.id,
          courseId: course.id,
          grantedBy: 'WEBHOOK',
        },
      });

      this.logger.log(
        `Granted access: user ${user.email} → course ${course.title}`,
      );
      await this.logService.updateStatus(logId, 200, 'Success');

      return {
        message: 'Webhook processed successfully',
        userId: user.id,
        courseId: course.id,
        isNewUser: !!generatedPassword,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error('Webhook processing error:', error);
      await this.logService.updateStatus(logId, 500, error instanceof Error ? error.message : String(error));
      throw new BadRequestException('Failed to process webhook');
    }
  }
}
