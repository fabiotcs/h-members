import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SessionsService } from './sessions.service';
import { SessionsCleanupTask } from './sessions.cleanup';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [SessionsService, SessionsCleanupTask],
  exports: [SessionsService],
})
export class SessionsModule {}
