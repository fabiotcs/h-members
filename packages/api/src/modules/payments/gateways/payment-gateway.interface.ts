export interface CreateCheckoutParams {
  courseId: number;
  courseTitle: string;
  priceInCents: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
  gateway: string;
}

export interface WebhookEvent {
  type: string;
  gateway: string;
  sessionId: string;
  customerEmail: string;
  customerName: string;
  metadata: Record<string, string>;
  amount: number;
  currency: string;
  raw: any;
}

export interface PaymentGateway {
  readonly name: string;
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>;
  parseWebhook(body: any, signature: string): Promise<WebhookEvent | null>;
}
