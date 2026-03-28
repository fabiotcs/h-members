import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUrl,
  ArrayNotEmpty,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VALID_EVENTS = [
  'user.registered',
  'user.login',
  'course.completed',
  'lesson.completed',
  'course.access.granted',
  'course.access.revoked',
] as const;

export class CreateWebhookConfigDto {
  @ApiProperty({
    example: 'https://example.com/webhook',
    description: 'URL de destino do webhook',
  })
  @IsUrl({ require_tld: false }, { message: 'URL invalida' })
  url: string;

  @ApiProperty({
    example: ['user.registered', 'course.completed'],
    description: 'Eventos assinados',
    enum: VALID_EVENTS,
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsIn(VALID_EVENTS, { each: true })
  events: string[];

  @ApiPropertyOptional({
    example: 'my-webhook-secret',
    description: 'Secret para assinatura HMAC (opcional)',
  })
  @IsString()
  @IsOptional()
  secret?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Se o webhook esta ativo',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
