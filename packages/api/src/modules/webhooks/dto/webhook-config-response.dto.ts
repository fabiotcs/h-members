import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookConfigResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'https://example.com/webhook' })
  url: string;

  @ApiProperty({
    example: ['user.registered', 'course.completed'],
    description: 'Eventos assinados',
  })
  events: string[];

  @ApiProperty({ example: true })
  active: boolean;

  @ApiPropertyOptional({
    example: '••••••••',
    description: 'Secret mascarado (null se nao configurado)',
    nullable: true,
  })
  secret: string | null;

  @ApiProperty({ example: '2026-03-27T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-27T00:00:00.000Z' })
  updatedAt: Date;
}
