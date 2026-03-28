import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  // Mark a lesson as complete (FR-040)
  async markLessonComplete(userId: number, lessonId: number) {
    return this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        completed: true,
        completedAt: new Date(),
      },
    });
  }

  // Unmark a lesson (toggle)
  async unmarkLessonComplete(userId: number, lessonId: number) {
    return this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      update: {
        completed: false,
        completedAt: null,
      },
      create: {
        userId,
        lessonId,
        completed: false,
      },
    });
  }

  // Save video position for resume playback (FR-029)
  async saveVideoPosition(userId: number, lessonId: number, position: number) {
    return this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      update: {
        videoPosition: position,
      },
      create: {
        userId,
        lessonId,
        videoPosition: position,
        completed: false,
      },
    });
  }

  // Get progress for a specific course (FR-041)
  async getCourseProgress(userId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!course) throw new NotFoundException('Curso não encontrado');

    const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const totalLessons = lessonIds.length;

    if (totalLessons === 0) {
      return { courseId, totalLessons: 0, completedLessons: 0, percentage: 0 };
    }

    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: lessonIds },
        completed: true,
      },
    });

    const percentage = Math.round((completedLessons / totalLessons) * 100);

    return {
      courseId,
      totalLessons,
      completedLessons,
      percentage,
    };
  }

  // Get progress for ALL courses of a user (for storefront cards) (FR-042)
  async getAllCoursesProgress(userId: number) {
    const accesses = await this.prisma.courseAccess.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    const results = [];

    for (const access of accesses) {
      const lessonIds = access.course.modules.flatMap((m) =>
        m.lessons.map((l) => l.id),
      );
      const totalLessons = lessonIds.length;

      let completedLessons = 0;
      if (totalLessons > 0) {
        completedLessons = await this.prisma.lessonProgress.count({
          where: {
            userId,
            lessonId: { in: lessonIds },
            completed: true,
          },
        });
      }

      results.push({
        courseId: access.courseId,
        totalLessons,
        completedLessons,
        percentage:
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0,
      });
    }

    return results;
  }

  // Get lesson-level progress for a course (FR-043 - checkmarks)
  async getLessonProgress(userId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: { id: true, title: true, order: true },
            },
          },
        },
      },
    });

    if (!course) throw new NotFoundException('Curso não encontrado');

    const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));

    const progress = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
      },
    });

    const progressMap = new Map(progress.map((p) => [p.lessonId, p]));

    return course.modules.map((mod) => ({
      moduleId: mod.id,
      moduleTitle: mod.title,
      lessons: mod.lessons.map((lesson) => ({
        lessonId: lesson.id,
        title: lesson.title,
        completed: progressMap.get(lesson.id)?.completed || false,
        completedAt: progressMap.get(lesson.id)?.completedAt || null,
        videoPosition: progressMap.get(lesson.id)?.videoPosition || 0,
      })),
    }));
  }

  // Get next uncompleted lesson for "Continue watching" (FR-044)
  async getNextLesson(userId: number, courseId: number) {
    const lessonProgress = await this.getLessonProgress(userId, courseId);

    for (const mod of lessonProgress) {
      for (const lesson of mod.lessons) {
        if (!lesson.completed) {
          return {
            lessonId: lesson.lessonId,
            title: lesson.title,
            moduleTitle: mod.moduleTitle,
            videoPosition: lesson.videoPosition,
          };
        }
      }
    }

    // All completed — return first lesson
    if (lessonProgress.length > 0 && lessonProgress[0].lessons.length > 0) {
      const first = lessonProgress[0].lessons[0];
      return {
        lessonId: first.lessonId,
        title: first.title,
        moduleTitle: lessonProgress[0].moduleTitle,
        videoPosition: 0,
        allCompleted: true,
      };
    }

    return null;
  }
}
