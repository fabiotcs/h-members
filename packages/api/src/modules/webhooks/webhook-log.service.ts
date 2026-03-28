import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookDirection, Prisma } from '@prisma/client';

@Injectable()
export class WebhookLogService {
  private readonly logger = new Logger(WebhookLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an incoming webhook request.
   * Returns the created log ID for subsequent status updates.
   */
  async logIncoming(event: string, payload: unknown): Promise<number> {
    const log = await this.prisma.webhookLog.create({
      data: {
        direction: WebhookDirection.IN,
        event,
        payload: payload as Prisma.InputJsonValue,
        statusCode: null,
        attempts: 1,
        response: null,
      },
    });
    return log.id;
  }

  /**
   * Log an outgoing webhook dispatch.
   * Returns the created log ID for subsequent status updates.
   */
  async logOutgoing(event: string, payload: unknown, url: string): Promise<number> {
    const log = await this.prisma.webhookLog.create({
      data: {
        direction: WebhookDirection.OUT,
        event,
        payload: payload as Prisma.InputJsonValue,
        statusCode: null,
        attempts: 1,
        response: `Target: ${url}`,
      },
    });
    return log.id;
  }

  /**
   * Update webhook log status after processing.
   */
  async updateStatus(
    logId: number,
    statusCode: number,
    response: string,
    attempts?: number,
  ): Promise<void> {
    try {
      await this.prisma.webhookLog.update({
        where: { id: logId },
        data: {
          statusCode,
          response,
          ...(attempts !== undefined && { attempts }),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update webhook log ${logId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List webhook logs with pagination and filters.
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    direction?: WebhookDirection;
    event?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { page = 1, limit = 20, direction, event, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.WebhookLogWhereInput = {};

    if (direction) {
      where.direction = direction;
    }
    if (event) {
      where.event = { contains: event };
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.webhookLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
