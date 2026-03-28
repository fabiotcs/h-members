import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLessonDto) {
    // Verify that the module exists
    const module = await this.prisma.courseModule.findUnique({
      where: { id: dto.moduleId },
    });
    if (!module) {
      throw new NotFoundException(
        `Modulo com ID ${dto.moduleId} nao encontrado`,
      );
    }

    // Validate YouTube URL
    this.extractYouTubeId(dto.videoUrl);

    // Auto-set order if not provided
    let order = dto.order;
    if (order === undefined) {
      const lastLesson = await this.prisma.lesson.findFirst({
        where: { moduleId: dto.moduleId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = lastLesson ? lastLesson.order + 1 : 0;
    }

    return this.prisma.lesson.create({
      data: {
        title: dto.title,
        description: dto.description,
        videoUrl: dto.videoUrl,
        duration: dto.duration,
        order,
        moduleId: dto.moduleId,
      },
    });
  }

  async findByModule(moduleId: number) {
    return this.prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        materials: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Aula com ID ${id} nao encontrada`);
    }

    return lesson;
  }

  async update(id: number, dto: UpdateLessonDto) {
    await this.findOne(id);

    // Validate YouTube URL if being updated
    if (dto.videoUrl !== undefined) {
      this.extractYouTubeId(dto.videoUrl);
    }

    return this.prisma.lesson.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.videoUrl !== undefined && { videoUrl: dto.videoUrl }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.lesson.delete({
      where: { id },
    });
  }

  async reorder(lessonIds: number[]) {
    if (!lessonIds.length) {
      throw new BadRequestException(
        'Lista de IDs de aulas nao pode ser vazia',
      );
    }

    // Verify all lessons exist and belong to the same module
    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: lessonIds } },
      select: { id: true, moduleId: true },
    });

    if (lessons.length !== lessonIds.length) {
      throw new BadRequestException('Um ou mais IDs de aulas sao invalidos');
    }

    const moduleIds = new Set(lessons.map((l) => l.moduleId));
    if (moduleIds.size > 1) {
      throw new BadRequestException(
        'Todas as aulas devem pertencer ao mesmo modulo',
      );
    }

    // Update order for each lesson in a transaction
    await this.prisma.$transaction(
      lessonIds.map((id, index) =>
        this.prisma.lesson.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return { message: 'Aulas reordenadas com sucesso' };
  }

  /**
   * Extracts YouTube video ID from multiple URL formats.
   * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
   * @throws BadRequestException if URL is not a valid YouTube URL
   */
  private extractYouTubeId(url: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    throw new BadRequestException(
      'URL do YouTube invalida. Formatos aceitos: youtube.com/watch?v=, youtu.be/, youtube.com/embed/',
    );
  }
}
