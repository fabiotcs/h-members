import { ApiProperty } from '@nestjs/swagger';

export class CourseProgressResponseDto {
  @ApiProperty({ example: 1 })
  courseId: number;

  @ApiProperty({ example: 20 })
  totalLessons: number;

  @ApiProperty({ example: 12 })
  completedLessons: number;

  @ApiProperty({ example: 60, description: 'Percentual de conclusao (0-100)' })
  percentage: number;
}

export class LessonProgressItemDto {
  @ApiProperty({ example: 1 })
  lessonId: number;

  @ApiProperty({ example: 'Introducao ao Marketing' })
  title: string;

  @ApiProperty({ example: true })
  completed: boolean;

  @ApiProperty({ example: '2026-03-27T10:00:00.000Z', nullable: true })
  completedAt: Date | null;

  @ApiProperty({ example: 120, description: 'Posicao do video em segundos' })
  videoPosition: number;
}

export class ModuleProgressResponseDto {
  @ApiProperty({ example: 1 })
  moduleId: number;

  @ApiProperty({ example: 'Modulo 1 — Fundamentos' })
  moduleTitle: string;

  @ApiProperty({ type: [LessonProgressItemDto] })
  lessons: LessonProgressItemDto[];
}

export class NextLessonResponseDto {
  @ApiProperty({ example: 5 })
  lessonId: number;

  @ApiProperty({ example: 'Estrategias Avancadas' })
  title: string;

  @ApiProperty({ example: 'Modulo 2 — Pratica' })
  moduleTitle: string;

  @ApiProperty({ example: 45, description: 'Posicao do video para resume' })
  videoPosition: number;

  @ApiProperty({
    example: false,
    required: false,
    description: 'True quando todas as aulas ja foram concluidas',
  })
  allCompleted?: boolean;
}
