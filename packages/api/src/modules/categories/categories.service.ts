import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const slug = await this.generateUniqueSlug(dto.slug ?? dto.name);

    const order =
      dto.order ??
      (await this.getNextOrder());

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        order,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        courses: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        courses: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return category;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    const data: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
      // Regenerate slug when name changes (unless a new slug is also provided)
      if (dto.slug === undefined) {
        data.slug = await this.generateUniqueSlug(dto.name, id);
      }
    }

    if (dto.slug !== undefined) {
      data.slug = await this.generateUniqueSlug(dto.slug, id);
    }

    if (dto.order !== undefined) {
      data.order = dto.order;
    }

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.category.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    // Courses with this categoryId will be set to null (onDelete: SetNull in schema)
    return this.prisma.category.delete({ where: { id } });
  }

  async reorder(categoryIds: number[]) {
    const updates = categoryIds.map((id, index) =>
      this.prisma.category.update({
        where: { id },
        data: { order: index },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.findAll();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async generateUniqueSlug(
    text: string,
    excludeId?: number,
  ): Promise<string> {
    const base = this.slugify(text);
    let candidate = base;
    let suffix = 2;

    while (true) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: candidate },
      });

      if (!existing || existing.id === excludeId) {
        return candidate;
      }

      candidate = `${base}-${suffix}`;
      suffix++;
    }
  }

  private async getNextOrder(): Promise<number> {
    const last = await this.prisma.category.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return (last?.order ?? -1) + 1;
  }
}
