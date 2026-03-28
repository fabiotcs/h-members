import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CourseAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user has access to a course.
   * Ref: FR-045, FR-047
   */
  async hasAccess(userId: number, courseId: number): Promise<boolean> {
    const access = await this.prisma.courseAccess.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    return !!access;
  }

  /**
   * Grant access to a course (admin or webhook action).
   * Uses upsert to be idempotent — granting twice is a no-op.
   * Ref: FR-051, FR-066
   */
  async grantAccess(
    userId: number,
    courseId: number,
    grantedBy: 'ADMIN' | 'WEBHOOK' = 'ADMIN',
  ) {
    return this.prisma.courseAccess.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: { userId, courseId, grantedBy },
    });
  }

  /**
   * Revoke access to a course.
   */
  async revokeAccess(userId: number, courseId: number) {
    const access = await this.prisma.courseAccess.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!access) throw new NotFoundException('Acesso nao encontrado');
    return this.prisma.courseAccess.delete({
      where: { userId_courseId: { userId, courseId } },
    });
  }

  /**
   * Get all courses a user has access to, with course details.
   */
  async getUserCourses(userId: number) {
    return this.prisma.courseAccess.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            category: true,
            _count: { select: { modules: true } },
          },
        },
      },
    });
  }

  /**
   * Get all users with access to a specific course (admin view).
   */
  async getCourseUsers(courseId: number) {
    return this.prisma.courseAccess.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Check access and return salesUrl when the user does not have access.
   * Used by the storefront check endpoint (FR-046).
   */
  async checkAccessWithSalesUrl(
    userId: number,
    courseId: number,
  ): Promise<{ hasAccess: boolean; salesUrl?: string | null }> {
    const hasAccess = await this.hasAccess(userId, courseId);

    if (hasAccess) {
      return { hasAccess: true };
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { salesUrl: true },
    });

    return { hasAccess: false, salesUrl: course?.salesUrl ?? null };
  }

  /**
   * Bulk grant access — grant multiple courses to a single user.
   * Uses a transaction for atomicity.
   */
  async bulkGrantAccess(
    userId: number,
    courseIds: number[],
    grantedBy: 'ADMIN' | 'WEBHOOK' = 'ADMIN',
  ) {
    const operations = courseIds.map((courseId) =>
      this.prisma.courseAccess.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: {},
        create: { userId, courseId, grantedBy },
      }),
    );
    return this.prisma.$transaction(operations);
  }
}
