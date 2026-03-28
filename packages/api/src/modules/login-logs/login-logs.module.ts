import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LoginLogsService } from './login-logs.service';
import { LoginLogsController } from './login-logs.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LoginLogsController],
  providers: [LoginLogsService],
  exports: [LoginLogsService],
})
export class LoginLogsModule {}
