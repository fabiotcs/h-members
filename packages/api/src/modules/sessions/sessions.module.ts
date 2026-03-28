import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsCleanupTask } from './sessions.cleanup';

@Module({
  providers: [SessionsService, SessionsCleanupTask],
  exports: [SessionsService],
})
export class SessionsModule {}
