import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    // Auto-set order to last position if not provided
    if (dto.order === undefined) {
      const maxOrder = await this.prisma.course.aggregate({
        _max: { order: true },
      });
      dto.order = (maxOrder._max.order || 0) + 1;
    }

    return this.prisma.course.create({
      data: dto,
      include: { category: true },
    });
  }

  async findAll(query: CourseQueryDto) {
    const { page = 1, limit = 20, categoryId, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {};
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (search) where.title = { contains: search };

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { order: 'asc' },
        include: {
          category: true,
          _count: { select: { modules: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                materials: true,
              },
            },
          },
        },
      },
    });

    if (!course) throw new NotFoundException('Curso nao encontrado');
    return course;
  }

  async update(id: number, dto: UpdateCourseDto) {
    await this.findOne(id); // Ensure exists
    return this.prisma.course.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Ensure exists
    return this.prisma.course.delete({ where: { id } });
  }

  async reorder(courseIds: number[]) {
    const updates = courseIds.map((id, index) =>
      this.prisma.course.update({
        where: { id },
        data: { order: index + 1 },
      }),
    );
    return this.prisma.$transaction(updates);
  }

  // For the smart storefront — get all active courses with user access info
  async findAllWithAccess(userId: number) {
    const courses = await this.prisma.course.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { order: 'asc' },
      include: {
        category: true,
        _count: { select: { modules: true } },
        courseAccesses: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    return courses.map(({ courseAccesses, ...course }) => ({
      ...course,
      hasAccess: courseAccesses.length > 0,
    }));
  }
}
