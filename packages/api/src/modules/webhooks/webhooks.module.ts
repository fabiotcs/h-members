import { Module } from '@nestjs/common';
import { UsersModule } from '../users';
import { CoursesModule } from '../courses';
import { EmailModule } from '../email';
import { WebhookIncomingService } from './incoming/webhook-incoming.service';
import { WebhookOutgoingService } from './outgoing/webhook-outgoing.service';
import { WebhookLogService } from './webhook-log.service';
import { WebhookIncomingController } from './incoming/webhook-incoming.controller';
import { WebhookConfigController } from './outgoing/webhook-config.controller';

@Module({
  imports: [UsersModule, CoursesModule, EmailModule],
  // PrismaModule is @Global() — no need to import
  providers: [WebhookIncomingService, WebhookOutgoingService, WebhookLogService],
  controllers: [WebhookIncomingController, WebhookConfigController],
  exports: [WebhookOutgoingService],
})
export class WebhooksModule {}
