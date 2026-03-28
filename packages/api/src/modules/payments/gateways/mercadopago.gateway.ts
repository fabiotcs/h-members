import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../../config';
import {
  PaymentGateway,
  CreateCheckoutParams,
  CheckoutResult,
  WebhookEvent,
} from './payment-gateway.interface';

@Injectable()
export class MercadoPagoGateway implements PaymentGateway {
  readonly name = 'mercadopago';
  private readonly accessToken: string;
  private readonly logger = new Logger(MercadoPagoGateway.name);

  constructor(private readonly config: AppConfigService) {
    this.accessToken = this.config.payments.mercadoPago.accessToken;
    if (this.accessToken) {
      this.logger.log('Mercado Pago gateway initialized');
    }
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!this.accessToken) throw new Error('Mercado Pago not configured');

    const appUrl = this.config.app.appUrl || 'http://localhost';

    // Use Mercado Pago Checkout Pro API directly via fetch
    const response = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          items: [
            {
              title: params.courseTitle,
              quantity: 1,
              unit_price: params.priceInCents / 100, // MP uses decimal, not cents
              currency_id: params.currency.toUpperCase(),
            },
          ],
          payer: {
            email: params.customerEmail,
            name: params.customerName,
          },
          metadata: {
            ...params.metadata,
            courseId: params.metadata.courseId,
          },
          back_urls: {
            success: params.successUrl,
            failure: params.cancelUrl,
            pending: params.cancelUrl,
          },
          auto_return: 'approved',
          notification_url: `${appUrl}/api/v1/payments/webhook/mercadopago`,
          payment_methods: {
            installments: 12,
            default_installments: 1,
          },
        }),
      },
    );

    const data: any = await response.json();

    if (!response.ok) {
      this.logger.error('Mercado Pago error:', data);
      throw new Error('Failed to create Mercado Pago checkout');
    }

    return {
      checkoutUrl: data.init_point,
      sessionId: String(data.id),
      gateway: 'mercadopago',
    };
  }

  async parseWebhook(
    body: any,
    _signature: string,
  ): Promise<WebhookEvent | null> {
    // Mercado Pago sends notification with type and data.id
    if (body.type !== 'payment' || !body.data?.id) return null;

    // Fetch full payment details from MP API
    const paymentId = body.data.id;
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      },
    );

    if (!response.ok) {
      this.logger.error('Failed to fetch MP payment:', paymentId);
      return null;
    }

    const payment: any = await response.json();

    if (payment.status !== 'approved') return null;

    return {
      type: 'payment.success',
      gateway: 'mercadopago',
      sessionId: String(payment.id),
      customerEmail: payment.payer?.email || '',
      customerName:
        `${payment.payer?.first_name || ''} ${payment.payer?.last_name || ''}`.trim(),
      metadata: payment.metadata || {},
      amount: Math.round(payment.transaction_amount * 100), // Convert to cents
      currency: payment.currency_id?.toLowerCase() || 'brl',
      raw: payment,
    };
  }
}
