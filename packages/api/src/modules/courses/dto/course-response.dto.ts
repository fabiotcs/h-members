import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '@prisma/client';

class CategorySummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Marketing' })
  name: string;

  @ApiProperty({ example: 'marketing' })
  slug: string;
}

export class CourseResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Marketing Digital Avancado' })
  title: string;

  @ApiPropertyOptional({ example: 'Aprenda estrategias avancadas...' })
  description: string | null;

  @ApiPropertyOptional({ example: '/uploads/covers/marketing.jpg' })
  coverImage: string | null;

  @ApiPropertyOptional({ example: 'https://hotmart.com/produto/123' })
  salesUrl: string | null;

  @ApiProperty({ enum: CourseStatus, example: CourseStatus.DRAFT })
  status: CourseStatus;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiPropertyOptional({ example: 1 })
  categoryId: number | null;

  @ApiPropertyOptional({ type: CategorySummaryDto })
  category: CategorySummaryDto | null;

  @ApiProperty({ example: '2026-03-27T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-27T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: { modules: 5 }, description: 'Related entities count' })
  _count?: { modules: number };
}

export class CourseWithAccessDto extends CourseResponseDto {
  @ApiProperty({ example: true, description: 'Whether the user has access to this course' })
  hasAccess: boolean;
}

export class PaginatedCoursesDto {
  @ApiProperty({ type: [CourseResponseDto] })
  data: CourseResponseDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
