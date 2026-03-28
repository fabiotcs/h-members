import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Marketing Digital' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'marketing-digital' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
