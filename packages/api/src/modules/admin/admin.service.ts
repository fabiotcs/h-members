import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalCourses,
      activeCourses,
      draftCourses,
      lessonsCompletedLast30d,
      loginsLast7d,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.course.count(),
      this.prisma.course.count({ where: { status: 'ACTIVE' } }),
      this.prisma.course.count({ where: { status: 'DRAFT' } }),
      this.prisma.lessonProgress.count({
        where: { completed: true, completedAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.loginLog.count({
        where: { success: true, createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers },
      courses: { total: totalCourses, active: activeCourses, draft: draftCourses },
      lessonsCompleted30d: lessonsCompletedLast30d,
      logins7d: loginsLast7d,
      recentUsers,
    };
  }

  async getUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const { page = 1, limit = 20, search, role, status } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          _count: { select: { courseAccesses: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        courseAccesses: {
          include: { course: { select: { id: true, title: true } } },
        },
        sessions: {
          where: { expiresAt: { gt: new Date() } },
          select: {
            id: true,
            ip: true,
            userAgent: true,
            createdAt: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    return user;
  }

  async updateUser(
    id: number,
    data: { name?: string; email?: string; role?: UserRole; status?: UserStatus },
  ) {
    await this.ensureUserExists(id);

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });
  }

  async forceLogout(userId: number) {
    await this.ensureUserExists(userId);

    const result = await this.prisma.session.deleteMany({
      where: { userId },
    });

    return { deletedSessions: result.count };
  }

  private async ensureUserExists(id: number): Promise<void> {
    const exists = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`User #${id} not found`);
    }
  }
}
