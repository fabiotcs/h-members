import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { CourseAccessService } from '../../modules/course-access/course-access.service';

/**
 * Guard that checks if the authenticated user has access to the course
 * specified by :courseId in the route params.
 *
 * Admins bypass the check automatically.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, CourseAccessGuard)
 *   @Get(':courseId/lessons')
 */
@Injectable()
export class CourseAccessGuard implements CanActivate {
  constructor(private readonly courseAccessService: CourseAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: number | undefined = request.user?.id;
    const courseId = parseInt(request.params.courseId, 10);

    if (!userId || isNaN(courseId)) return false;

    // Admins always have access
    if (request.user.role === 'ADMIN') return true;

    const hasAccess = await this.courseAccessService.hasAccess(
      userId,
      courseId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('Voce nao tem acesso a este curso');
    }
    return true;
  }
}
