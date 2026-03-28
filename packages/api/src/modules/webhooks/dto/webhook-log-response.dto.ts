import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookDirection } from '@prisma/client';

export class WebhookLogResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: WebhookDirection, example: 'IN' })
  direction: WebhookDirection;

  @ApiProperty({ example: 'sale.confirmed' })
  event: string;

  @ApiPropertyOptional({ description: 'Payload JSON do webhook', nullable: true })
  payload: unknown;

  @ApiPropertyOptional({ example: 200, nullable: true })
  statusCode: number | null;

  @ApiProperty({ example: 1 })
  attempts: number;

  @ApiPropertyOptional({ example: 'Success', nullable: true })
  response: string | null;

  @ApiProperty({ example: '2026-03-27T00:00:00.000Z' })
  createdAt: Date;
}

export class PaginatedWebhookLogsDto {
  @ApiProperty({ type: [WebhookLogResponseDto] })
  data: WebhookLogResponseDto[];

  @ApiProperty({
    example: { total: 100, page: 1, limit: 20, totalPages: 5 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
