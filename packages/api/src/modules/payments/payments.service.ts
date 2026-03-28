import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config';
import { CourseAccessService } from '../course-access/course-access.service';
import { PaymentGateway, WebhookEvent } from './gateways/payment-gateway.interface';
import { StripeGateway } from './gateways/stripe.gateway';
import { MercadoPagoGateway } from './gateways/mercadopago.gateway';
import { AsaasGateway } from './gateways/asaas.gateway';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private gateways: Map<string, PaymentGateway> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly courseAccess: CourseAccessService,
    private readonly stripeGw: StripeGateway,
    private readonly mpGw: MercadoPagoGateway,
    private readonly asaasGw: AsaasGateway,
  ) {
    // Register available gateways
    if (config.payments.stripe.secretKey) {
      this.gateways.set('stripe', stripeGw);
    }
    if (config.payments.mercadoPago.accessToken) {
      this.gateways.set('mercadopago', mpGw);
    }
    if (config.payments.asaas.apiKey) {
      this.gateways.set('asaas', asaasGw);
    }
    this.logger.log(
      `Payment gateways available: ${Array.from(this.gateways.keys()).join(', ') || 'none'}`,
    );
  }

  getActiveGateway(): string {
    return this.config.payments.gateway;
  }

  getAvailableGateways(): string[] {
    return Array.from(this.gateways.keys());
  }

  getPublicKeys() {
    return {
      activeGateway: this.getActiveGateway(),
      stripe: this.config.payments.stripe.publishableKey || null,
      mercadoPago: this.config.payments.mercadoPago.publicKey || null,
    };
  }

  async createCheckout(courseId: number, userId: number) {
    const gatewayName = this.getActiveGateway();
    if (gatewayName === 'none') {
      throw new BadRequestException(
        'Nenhum gateway de pagamento configurado',
      );
    }

    const gateway = this.gateways.get(gatewayName);
    if (!gateway) {
      throw new BadRequestException(
        `Gateway ${gatewayName} nao esta disponivel`,
      );
    }

    // Get course
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Curso nao encontrado');
    if (!course.priceInCents || course.priceInCents <= 0) {
      throw new BadRequestException('Curso nao tem preco configurado');
    }

    // Check if already has access
    const hasAccess = await this.courseAccess.hasAccess(userId, courseId);
    if (hasAccess) {
      throw new BadRequestException('Voce ja tem acesso a este curso');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Usuario nao encontrado');

    const successUrl =
      this.config.payments.successUrl ||
      `${this.config.app.appUrl}/payment/success`;
    const cancelUrl =
      this.config.payments.cancelUrl ||
      `${this.config.app.appUrl}/courses/${courseId}`;

    const result = await gateway.createCheckout({
      courseId,
      courseTitle: course.title,
      priceInCents: course.priceInCents,
      currency: 'brl',
      customerEmail: user.email,
      customerName: user.name,
      metadata: {
        courseId: String(courseId),
        userId: String(userId),
        platform: 'h-members',
      },
      successUrl,
      cancelUrl,
    });

    // Log the checkout
    await this.prisma.webhookLog.create({
      data: {
        direction: 'OUT',
        event: 'checkout.created',
        payload: { ...result, userId, courseId } as any,
        statusCode: 200,
        attempts: 1,
      },
    });

    return result;
  }

  async handleWebhook(gatewayName: string, body: any, signature: string) {
    const gateway = this.gateways.get(gatewayName);
    if (!gateway) {
      this.logger.warn(`Unknown gateway: ${gatewayName}`);
      return { received: true };
    }

    const event = await gateway.parseWebhook(body, signature);
    if (!event) {
      return { received: true, processed: false };
    }

    this.logger.log(
      `Payment webhook: ${event.type} from ${event.gateway} — ${event.customerEmail}`,
    );

    // Log the webhook
    await this.prisma.webhookLog.create({
      data: {
        direction: 'IN',
        event: `payment.${event.gateway}.${event.type}`,
        payload: event as any,
        statusCode: 200,
        attempts: 1,
      },
    });

    if (event.type === 'payment.success') {
      await this.processSuccessfulPayment(event);
    }

    return { received: true, processed: true };
  }

  private async processSuccessfulPayment(event: WebhookEvent) {
    const courseId = parseInt(event.metadata.courseId, 10);
    if (!courseId) {
      this.logger.error('Payment webhook missing courseId in metadata');
      return;
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: event.customerEmail },
    });

    if (!user) {
      const password = crypto.randomBytes(8).toString('hex');
      const passwordHash = await bcrypt.hash(password, 10);
      user = await this.prisma.user.create({
        data: {
          email: event.customerEmail,
          name: event.customerName || event.customerEmail.split('@')[0],
          passwordHash,
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      });
      this.logger.log(`Created user from payment: ${user.email}`);
      // TODO: send welcome email with credentials
    }

    // Grant course access
    await this.courseAccess.grantAccess(user.id, courseId, 'WEBHOOK');
    this.logger.log(
      `Granted access: ${user.email} → course ${courseId} (via ${event.gateway})`,
    );
  }
}
