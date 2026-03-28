import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class CourseModulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateModuleDto) {
    // Verify that the course exists
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });
    if (!course) {
      throw new NotFoundException(`Curso com ID ${dto.courseId} nao encontrado`);
    }

    // Auto-set order if not provided
    let order = dto.order;
    if (order === undefined) {
      const lastModule = await this.prisma.courseModule.findFirst({
        where: { courseId: dto.courseId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = lastModule ? lastModule.order + 1 : 0;
    }

    return this.prisma.courseModule.create({
      data: {
        title: dto.title,
        description: dto.description,
        order,
        courseId: dto.courseId,
      },
    });
  }

  async findByCourse(courseId: number) {
    return this.prisma.courseModule.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: number) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Modulo com ID ${id} nao encontrado`);
    }

    return module;
  }

  async update(id: number, dto: UpdateModuleDto) {
    await this.findOne(id);

    return this.prisma.courseModule.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.courseModule.delete({
      where: { id },
    });
  }

  async reorder(moduleIds: number[]) {
    if (!moduleIds.length) {
      throw new BadRequestException(
        'Lista de IDs de modulos nao pode ser vazia',
      );
    }

    // Verify all modules exist and belong to the same course
    const modules = await this.prisma.courseModule.findMany({
      where: { id: { in: moduleIds } },
      select: { id: true, courseId: true },
    });

    if (modules.length !== moduleIds.length) {
      throw new BadRequestException(
        'Um ou mais IDs de modulos sao invalidos',
      );
    }

    const courseIds = new Set(modules.map((m) => m.courseId));
    if (courseIds.size > 1) {
      throw new BadRequestException(
        'Todos os modulos devem pertencer ao mesmo curso',
      );
    }

    // Update order for each module in a transaction
    await this.prisma.$transaction(
      moduleIds.map((id, index) =>
        this.prisma.courseModule.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return { message: 'Modulos reordenados com sucesso' };
  }
}
