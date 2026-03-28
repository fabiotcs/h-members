import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller';
import { CourseAccessModule } from '../course-access/course-access.module';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [CourseAccessModule, CoursesModule],
  controllers: [StorefrontController],
})
export class StorefrontModule {}
