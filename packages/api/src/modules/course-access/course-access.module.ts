import { Module } from '@nestjs/common';
import { CourseAccessService } from './course-access.service';
import { CourseAccessController } from './course-access.controller';

@Module({
  // PrismaModule is @Global() — no need to import
  providers: [CourseAccessService],
  controllers: [CourseAccessController],
  exports: [CourseAccessService],
})
export class CourseAccessModule {}
