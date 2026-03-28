import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionsService } from './sessions.service';

@Injectable()
export class SessionsCleanupTask {
  private readonly logger = new Logger(SessionsCleanupTask.name);

  constructor(private readonly sessionsService: SessionsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanup(): Promise<void> {
    this.logger.debug('Running scheduled session cleanup...');
    try {
      const count = await this.sessionsService.cleanupExpiredSessions();
      if (count > 0) {
        this.logger.log(
          `Scheduled cleanup removed ${count} expired session(s)`,
        );
      }
    } catch (error) {
      this.logger.error('Session cleanup failed', error);
    }
  }
}
