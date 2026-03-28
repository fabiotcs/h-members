import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config';
import { PrismaModule } from './prisma/prisma.module';
import { SettingsModule } from './modules/settings';
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { HealthModule } from './modules/health';
import { CoursesModule } from './modules/courses';
import { CourseModulesModule } from './modules/course-modules';
import { LessonsModule } from './modules/lessons';
import { UploadModule } from './modules/upload';
import { ProgressModule } from './modules/progress';
import { CourseAccessModule } from './modules/course-access';
import { StorefrontModule } from './modules/storefront';
import { WebhooksModule } from './modules/webhooks';
import { CategoriesModule } from './modules/categories';
import { LoginLogsModule } from './modules/login-logs';
import { SessionsModule } from './modules/sessions';
import { AdminModule } from './modules/admin';
import { EmailModule } from './modules/email';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // ConfigModule with env validation — must be first
    AppConfigModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    SettingsModule,
    AuthModule,
    UsersModule,
    HealthModule,
    CoursesModule,
    CourseModulesModule,
    LessonsModule,
    CategoriesModule,
    UploadModule,
    ProgressModule,
    CourseAccessModule,
    StorefrontModule,
    WebhooksModule,
    LoginLogsModule,
    SessionsModule,
    EmailModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
