import { IsOptional, IsInt, Min, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WebhookDirection } from '@prisma/client';

export class WebhookLogQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Pagina' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Itens por pagina' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: WebhookDirection,
    description: 'Filtrar por direcao (IN ou OUT)',
  })
  @IsEnum(WebhookDirection)
  @IsOptional()
  direction?: WebhookDirection;

  @ApiPropertyOptional({ example: 'sale.confirmed', description: 'Filtrar por evento' })
  @IsString()
  @IsOptional()
  event?: string;

  @ApiPropertyOptional({
    example: '2026-01-01T00:00:00.000Z',
    description: 'Data inicio (ISO 8601)',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Data fim (ISO 8601)',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
