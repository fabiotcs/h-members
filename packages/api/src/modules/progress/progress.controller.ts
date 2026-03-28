import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ProgressService } from './progress.service';
import { SaveVideoPositionDto } from './dto/save-video-position.dto';
import {
  CourseProgressResponseDto,
  ModuleProgressResponseDto,
  NextLessonResponseDto,
} from './dto/course-progress-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('progress')
@ApiBearerAuth()
@Controller('v1/progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('lesson/:lessonId/complete')
  @ApiOperation({ summary: 'Marcar aula como concluida (FR-040)' })
  @ApiParam({ name: 'lessonId', type: Number })
  @ApiResponse({ status: 201, description: 'Aula marcada como concluida' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  async markComplete(
    @Req() req: Request,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    const user = req.user as { id: number };
    return this.progressService.markLessonComplete(user.id, lessonId);
  }

  @Delete('lesson/:lessonId/complete')
  @ApiOperation({ summary: 'Desmarcar aula como concluida (toggle)' })
  @ApiParam({ name: 'lessonId', type: Number })
  @ApiResponse({ status: 200, description: 'Aula desmarcada' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  async unmarkComplete(
    @Req() req: Request,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    const user = req.user as { id: number };
    return this.progressService.unmarkLessonComplete(user.id, lessonId);
  }

  @Put('lesson/:lessonId/position')
  @ApiOperation({ summary: 'Salvar posicao do video para resume playback (FR-029)' })
  @ApiParam({ name: 'lessonId', type: Number })
  @ApiResponse({ status: 200, description: 'Posicao salva' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  async savePosition(
    @Req() req: Request,
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: SaveVideoPositionDto,
  ) {
    const user = req.user as { id: number };
    return this.progressService.saveVideoPosition(
      user.id,
      lessonId,
      dto.position,
    );
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Obter progresso de um curso (percentual) (FR-041)' })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Progresso do curso',
    type: CourseProgressResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 404, description: 'Curso nao encontrado' })
  async getCourseProgress(
    @Req() req: Request,
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<CourseProgressResponseDto> {
    const user = req.user as { id: number };
    return this.progressService.getCourseProgress(user.id, courseId);
  }

  @Get('course/:courseId/lessons')
  @ApiOperation({
    summary: 'Obter progresso por aula com checkmarks (FR-043)',
  })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Progresso detalhado por modulo e aula',
    type: [ModuleProgressResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 404, description: 'Curso nao encontrado' })
  async getLessonProgress(
    @Req() req: Request,
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<ModuleProgressResponseDto[]> {
    const user = req.user as { id: number };
    return this.progressService.getLessonProgress(user.id, courseId);
  }

  @Get('course/:courseId/next')
  @ApiOperation({
    summary: 'Obter proxima aula nao concluida — "Continue assistindo" (FR-044)',
  })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Proxima aula ou null se nenhum curso',
    type: NextLessonResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 404, description: 'Curso nao encontrado' })
  async getNextLesson(
    @Req() req: Request,
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<NextLessonResponseDto | null> {
    const user = req.user as { id: number };
    return this.progressService.getNextLesson(user.id, courseId);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Obter progresso de todos os cursos do usuario (vitrine) (FR-042)',
  })
  @ApiResponse({
    status: 200,
    description: 'Progresso de todos os cursos com acesso',
    type: [CourseProgressResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  async getAllProgress(
    @Req() req: Request,
  ): Promise<CourseProgressResponseDto[]> {
    const user = req.user as { id: number };
    return this.progressService.getAllCoursesProgress(user.id);
  }
}
