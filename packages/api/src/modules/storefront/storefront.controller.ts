import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StorefrontCourseDto } from './dto/storefront-response.dto';

/**
 * Storefront endpoint — combines courses, access status, and progress
 * into a single optimized response for the "Vitrine Inteligente".
 * Ref: FR-045, FR-046, FR-047
 */
@ApiTags('storefront')
@Controller('v1/storefront')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StorefrontController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Vitrine inteligente — cursos com acesso e progresso do usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cursos da vitrine com status de acesso e progresso',
    type: [StorefrontCourseDto],
  })
  async getStorefront(
    @CurrentUser('id') userId: number,
  ): Promise<StorefrontCourseDto[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Single optimized query: all active courses with user's access and progress
    const courses = await this.prisma.course.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { order: 'asc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        courseAccesses: {
          where: { userId },
          select: { id: true },
        },
        modules: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                order: true,
                moduleId: true,
                lessonProgresses: {
                  where: { userId },
                  select: { completed: true },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return courses.map((course) => {
      const hasAccess = course.courseAccesses.length > 0;
      const isNew = course.createdAt >= thirtyDaysAgo;

      // Flatten all lessons across modules
      const allLessons = course.modules.flatMap((m) => m.lessons);
      const totalLessons = allLessons.length;

      let progress: StorefrontCourseDto['progress'] = null;
      let nextLesson: StorefrontCourseDto['nextLesson'] = undefined;

      if (hasAccess && totalLessons > 0) {
        const completedLessons = allLessons.filter(
          (l) => l.lessonProgresses.length > 0 && l.lessonProgresses[0].completed,
        ).length;

        const percentage =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        progress = { percentage, completedLessons, totalLessons };

        // Find next incomplete lesson (only if user has started)
        if (completedLessons > 0 && completedLessons < totalLessons) {
          const next = allLessons.find(
            (l) =>
              l.lessonProgresses.length === 0 || !l.lessonProgresses[0].completed,
          );
          if (next) {
            nextLesson = { lessonId: next.id, title: next.title };
          }
        }
      }

      return {
        id: course.id,
        title: course.title,
        description: course.description ?? '',
        coverImage: course.coverImage ?? '',
        salesUrl: course.salesUrl ?? '',
        category: course.category,
        hasAccess,
        progress,
        isNew,
        nextLesson,
      };
    });
  }
}
