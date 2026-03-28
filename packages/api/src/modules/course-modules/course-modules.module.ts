import { Module } from '@nestjs/common';
import { CourseModulesService } from './course-modules.service';
import { CourseModulesController } from './course-modules.controller';

@Module({
  // PrismaModule is @Global() — no need to import
  providers: [CourseModulesService],
  controllers: [CourseModulesController],
  exports: [CourseModulesService],
})
export class CourseModulesModule {}
