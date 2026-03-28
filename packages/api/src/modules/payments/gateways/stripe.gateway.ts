import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../../config';
import {
  PaymentGateway,
  CreateCheckoutParams,
  CheckoutResult,
  WebhookEvent,
} from './payment-gateway.interface';

@Injectable()
export class StripeGateway implements PaymentGateway {
  readonly name = 'stripe';
  private stripe: any;
  private readonly logger = new Logger(StripeGateway.name);

  constructor(private readonly config: AppConfigService) {
    const key = this.config.payments.stripe.secretKey;
    if (key) {
      // Dynamic import to avoid crash if stripe not installed
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Stripe = require('stripe');
        this.stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' });
        this.logger.log('Stripe gateway initialized');
      } catch {
        this.logger.warn('Stripe SDK not installed — gateway disabled');
      }
    }
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!this.stripe) throw new Error('Stripe not configured');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'pix'],
      customer_email: params.customerEmail,
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: {
              name: params.courseTitle,
              metadata: params.metadata,
            },
            unit_amount: params.priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        ...params.metadata,
        courseId: String(params.metadata.courseId),
      },
      success_url: params.successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: params.cancelUrl,
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
      gateway: 'stripe',
    };
  }

  async parseWebhook(
    body: any,
    signature: string,
  ): Promise<WebhookEvent | null> {
    if (!this.stripe) return null;

    const webhookSecret = this.config.payments.stripe.webhookSecret;
    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error('Stripe webhook signature verification failed');
      return null;
    }

    if (event.type !== 'checkout.session.completed') return null;

    const session = event.data.object;
    return {
      type: 'payment.success',
      gateway: 'stripe',
      sessionId: session.id,
      customerEmail:
        session.customer_email || session.customer_details?.email,
      customerName: session.customer_details?.name || '',
      metadata: session.metadata || {},
      amount: session.amount_total || 0,
      currency: session.currency || 'brl',
      raw: event,
    };
  }
}
