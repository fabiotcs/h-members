import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class StorefrontCategoryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Marketing' })
  name: string;

  @ApiProperty({ example: 'marketing' })
  slug: string;
}

class StorefrontProgressDto {
  @ApiProperty({ example: 45, description: 'Percentual de conclusao (0-100)' })
  percentage: number;

  @ApiProperty({ example: 9 })
  completedLessons: number;

  @ApiProperty({ example: 20 })
  totalLessons: number;
}

class StorefrontNextLessonDto {
  @ApiProperty({ example: 10 })
  lessonId: number;

  @ApiProperty({ example: 'Aula 10 — Funis de Vendas' })
  title: string;
}

export class StorefrontCourseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Marketing Digital Avancado' })
  title: string;

  @ApiProperty({ example: 'Aprenda estrategias avancadas de marketing...' })
  description: string;

  @ApiProperty({ example: '/uploads/covers/marketing.jpg' })
  coverImage: string;

  @ApiProperty({ example: 'https://hotmart.com/produto/123' })
  salesUrl: string;

  @ApiPropertyOptional({ type: StorefrontCategoryDto, nullable: true })
  category: StorefrontCategoryDto | null;

  @ApiProperty({
    example: true,
    description: 'Se o usuario tem acesso ao curso (FR-045, FR-047)',
  })
  hasAccess: boolean;

  @ApiPropertyOptional({
    type: StorefrontProgressDto,
    nullable: true,
    description: 'Progresso do usuario (apenas se hasAccess = true)',
  })
  progress: StorefrontProgressDto | null;

  @ApiProperty({
    example: false,
    description: 'Curso criado nos ultimos 30 dias',
  })
  isNew: boolean;

  @ApiPropertyOptional({
    type: StorefrontNextLessonDto,
    description: 'Proxima aula (apenas se hasAccess e ja iniciou o curso)',
  })
  nextLesson?: StorefrontNextLessonDto;
}
