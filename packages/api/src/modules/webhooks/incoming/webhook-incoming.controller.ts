import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { WebhookIncomingService } from './webhook-incoming.service';

@ApiTags('webhooks')
@Controller('v1/webhooks')
export class WebhookIncomingController {
  constructor(private readonly incomingService: WebhookIncomingService) {}

  /**
   * Receive incoming sale webhook from external platforms.
   * Public endpoint — authenticated via WEBHOOK_SECRET, not JWT.
   * Ref: FR-050, FR-051, FR-053
   */
  @Post('incoming')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({
    summary: 'Receber webhook de venda de plataforma externa',
    description:
      'Endpoint publico validado por WEBHOOK_SECRET. Cria usuario e libera acesso ao curso.',
  })
  @ApiHeader({
    name: 'x-webhook-secret',
    description: 'Secret direto para validacao',
    required: false,
  })
  @ApiHeader({
    name: 'x-hub-signature-256',
    description: 'HMAC-SHA256 signature do payload',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        userId: { type: 'number' },
        courseId: { type: 'number' },
        isNewUser: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Signature invalida' })
  @ApiResponse({ status: 400, description: 'Payload invalido ou erro de processamento' })
  @ApiResponse({ status: 429, description: 'Rate limit excedido' })
  async handleIncoming(
    @Req() req: Request,
    @Headers('x-webhook-secret') webhookSecret?: string,
    @Headers('x-hub-signature-256') hubSignature?: string,
  ) {
    // Use raw body for HMAC validation; fallback to JSON.stringify
    const rawBody =
      typeof (req as any).rawBody === 'string'
        ? (req as any).rawBody
        : JSON.stringify(req.body);

    // Prefer X-Hub-Signature-256, fallback to X-Webhook-Secret
    const signature = hubSignature || webhookSecret || '';

    return this.incomingService.processSaleWebhook(req.body, rawBody, signature);
  }
}
