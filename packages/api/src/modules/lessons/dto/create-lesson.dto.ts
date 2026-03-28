import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ example: 1, description: 'ID do modulo ao qual a aula pertence' })
  @IsInt()
  moduleId: number;

  @ApiProperty({ example: 'O que e Marketing Digital?' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Nesta aula voce aprendera os conceitos basicos...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'URL do video no YouTube. Formatos aceitos: youtube.com/watch?v=, youtu.be/, youtube.com/embed/',
  })
  @IsString()
  videoUrl: string;

  @ApiPropertyOptional({
    example: 15,
    description: 'Duracao estimada da aula em minutos',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Ordem da aula dentro do modulo. Se nao informado, sera definido automaticamente.',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
