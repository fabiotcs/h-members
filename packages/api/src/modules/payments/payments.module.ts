import { Module } from '@nestjs/common';
import { CourseAccessModule } from '../course-access';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeGateway } from './gateways/stripe.gateway';
import { MercadoPagoGateway } from './gateways/mercadopago.gateway';
import { AsaasGateway } from './gateways/asaas.gateway';

@Module({
  imports: [CourseAccessModule],
  // PrismaModule and AppConfigModule are @Global() — no need to import
  providers: [PaymentsService, StripeGateway, MercadoPagoGateway, AsaasGateway],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
