import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../../config';
import {
  PaymentGateway,
  CreateCheckoutParams,
  CheckoutResult,
  WebhookEvent,
} from './payment-gateway.interface';

@Injectable()
export class AsaasGateway implements PaymentGateway {
  readonly name = 'asaas';
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly logger = new Logger(AsaasGateway.name);

  constructor(private readonly config: AppConfigService) {
    this.apiKey = this.config.payments.asaas.apiKey;
    // Asaas has sandbox and production environments
    this.baseUrl = this.config.payments.asaas.sandbox
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3';

    if (this.apiKey) {
      this.logger.log(
        `Asaas gateway initialized (${this.config.payments.asaas.sandbox ? 'sandbox' : 'production'})`,
      );
    }
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!this.apiKey) {
      throw new Error('Asaas not configured');
    }

    // Step 1: Find or create customer in Asaas
    const customer = await this.findOrCreateCustomer(
      params.customerEmail,
      params.customerName,
    );

    // Step 2: Create payment (charge)
    // billingType UNDEFINED lets the customer choose: PIX, boleto, or credit card
    const paymentResponse = await this.apiRequest('POST', '/payments', {
      customer: customer.id,
      billingType: 'UNDEFINED',
      value: params.priceInCents / 100, // Asaas uses decimal (BRL)
      description: params.courseTitle,
      externalReference: JSON.stringify({
        courseId: params.metadata.courseId,
        userId: params.metadata.userId,
        platform: 'h-members',
      }),
      callback: {
        successUrl: params.successUrl,
        autoRedirect: true,
      },
    });

    if (!paymentResponse.id) {
      this.logger.error('Asaas payment creation failed', paymentResponse);
      throw new Error('Failed to create Asaas payment');
    }

    // invoiceUrl is the Asaas-hosted checkout page where the customer chooses payment method
    return {
      checkoutUrl:
        paymentResponse.invoiceUrl ||
        `https://www.asaas.com/i/${paymentResponse.id}`,
      sessionId: paymentResponse.id,
      gateway: 'asaas',
    };
  }

  async parseWebhook(
    body: any,
    signature: string,
  ): Promise<WebhookEvent | null> {
    // Verify webhook token if configured
    const webhookToken = this.config.payments.asaas.webhookToken;
    if (webhookToken && signature !== webhookToken) {
      this.logger.error('Asaas webhook token mismatch');
      return null;
    }

    // Only process confirmed payment events
    const confirmedEvents = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'];
    if (!confirmedEvents.includes(body.event)) {
      return null;
    }

    const payment = body.payment;
    if (!payment) {
      return null;
    }

    // Parse externalReference to recover courseId and userId
    let metadata: Record<string, string> = {};
    try {
      metadata = JSON.parse(payment.externalReference || '{}');
    } catch {
      this.logger.warn(
        'Failed to parse Asaas externalReference',
        payment.externalReference,
      );
    }

    // Fetch customer details for email/name
    let customerEmail = '';
    let customerName = '';
    if (payment.customer) {
      try {
        const customer = await this.apiRequest(
          'GET',
          `/customers/${payment.customer}`,
        );
        customerEmail = customer.email || '';
        customerName = customer.name || '';
      } catch {
        this.logger.warn(
          'Failed to fetch Asaas customer',
          payment.customer,
        );
      }
    }

    return {
      type: 'payment.success',
      gateway: 'asaas',
      sessionId: payment.id,
      customerEmail,
      customerName,
      metadata,
      amount: Math.round((payment.value || 0) * 100), // Convert back to cents
      currency: 'brl',
      raw: body,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async findOrCreateCustomer(
    email: string,
    name: string,
  ): Promise<{ id: string }> {
    // Search for existing customer by email
    const searchResult = await this.apiRequest(
      'GET',
      `/customers?email=${encodeURIComponent(email)}`,
    );

    if (searchResult.data && searchResult.data.length > 0) {
      return { id: searchResult.data[0].id };
    }

    // Create new customer
    const customer = await this.apiRequest('POST', '/customers', {
      name: name || email.split('@')[0],
      email,
      notificationDisabled: true,
    });

    return { id: customer.id };
  }

  private async apiRequest(
    method: string,
    path: string,
    body?: any,
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        access_token: this.apiKey,
        'User-Agent': 'H-Members/1.0',
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      this.logger.error(`Asaas API error [${method} ${path}]`, data);
      throw new Error(`Asaas API error: ${response.status}`);
    }

    return data;
  }
}
