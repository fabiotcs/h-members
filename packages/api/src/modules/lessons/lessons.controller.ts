import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('lessons')
@ApiBearerAuth()
@Controller('v1/lessons')
@UseGuards(RolesGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar aula (admin)' })
  async create(@Body() dto: CreateLessonDto) {
    return this.lessonsService.create(dto);
  }

  @Get('module/:moduleId')
  @ApiOperation({ summary: 'Listar aulas de um modulo' })
  @ApiParam({ name: 'moduleId', type: Number })
  async findByModule(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.lessonsService.findByModule(moduleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter aula com materiais' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.findOne(id);
  }

  @Patch('reorder')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reordenar aulas de um modulo (admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lessonIds: {
          type: 'array',
          items: { type: 'number' },
          example: [3, 1, 2],
          description: 'IDs das aulas na nova ordem desejada',
        },
      },
      required: ['lessonIds'],
    },
  })
  async reorder(@Body('lessonIds') lessonIds: number[]) {
    return this.lessonsService.reorder(lessonIds);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar aula (admin)' })
  @ApiParam({ name: 'id', type: Number })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover aula e seus materiais (admin)' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.remove(id);
  }
}
