import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoginLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    userId: number | null,
    ip: string,
    userAgent: string,
    success: boolean,
  ): Promise<void> {
    await this.prisma.loginLog.create({
      data: { userId, ip, userAgent, success },
    });
  }

  async getByUser(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.loginLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loginLog.count({ where: { userId } }),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRecent(limit = 50) {
    return this.prisma.loginLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
