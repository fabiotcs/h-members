import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({ example: 1, description: 'ID do curso ao qual o modulo pertence' })
  @IsInt()
  courseId: number;

  @ApiProperty({ example: 'Introducao ao Marketing Digital' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Neste modulo voce aprendera os fundamentos...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Ordem do modulo dentro do curso. Se nao informado, sera definido automaticamente.',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
