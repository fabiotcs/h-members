import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '@prisma/client';

export class CreateCourseDto {
  @ApiProperty({ example: 'Marketing Digital Avancado' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Aprenda estrategias avancadas...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '/uploads/covers/marketing.jpg' })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({ example: 'https://hotmart.com/produto/123' })
  @IsString()
  @IsOptional()
  salesUrl?: string;

  @ApiPropertyOptional({ example: 9900, description: 'Preco em centavos (ex: 9900 = R$ 99,00)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  priceInCents?: number;

  @ApiPropertyOptional({ enum: CourseStatus, default: CourseStatus.DRAFT })
  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  categoryId?: number;
}
