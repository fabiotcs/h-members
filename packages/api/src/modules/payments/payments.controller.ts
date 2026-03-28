import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  Headers,
  ParseIntPipe,
  UseGuards,
  RawBodyRequest,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import {
  CreateCheckoutResponseDto,
  PaymentConfigResponseDto,
} from './dto/create-checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('config')
  @ApiOperation({
    summary: 'Obter configuracao de pagamento (chaves publicas)',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuracao de pagamento',
    type: PaymentConfigResponseDto,
  })
  getConfig(): PaymentConfigResponseDto {
    return this.paymentsService.getPublicKeys();
  }

  @Post('checkout/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar sessao de checkout para um curso' })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Sessao de checkout criada',
    type: CreateCheckoutResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Gateway nao configurado ou curso sem preco' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 404, description: 'Curso nao encontrado' })
  async createCheckout(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: Request,
  ): Promise<CreateCheckoutResponseDto> {
    const user = req.user as { id: number };
    return this.paymentsService.createCheckout(courseId, user.id);
  }

  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Webhook do Stripe (chamado pelo Stripe)' })
  @ApiResponse({ status: 200, description: 'Webhook recebido' })
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    // Stripe requires raw body for signature verification
    const rawBody = req.rawBody || req.body;
    return this.paymentsService.handleWebhook('stripe', rawBody, signature || '');
  }

  @Post('webhook/mercadopago')
  @ApiOperation({ summary: 'Webhook do Mercado Pago (chamado pelo MP)' })
  @ApiResponse({ status: 200, description: 'Webhook recebido' })
  async mercadoPagoWebhook(
    @Req() req: Request,
    @Headers('x-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(
      'mercadopago',
      req.body,
      signature || '',
    );
  }

  @Post('webhook/asaas')
  @ApiOperation({ summary: 'Webhook do Asaas (chamado pelo Asaas)' })
  @ApiResponse({ status: 200, description: 'Webhook recebido' })
  async asaasWebhook(
    @Req() req: Request,
    @Headers('asaas-access-token') token: string,
  ) {
    return this.paymentsService.handleWebhook(
      'asaas',
      req.body,
      token || '',
    );
  }
}
