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
import { CourseModulesService } from './course-modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('course-modules')
@ApiBearerAuth()
@Controller('api/v1/course-modules')
@UseGuards(RolesGuard)
export class CourseModulesController {
  constructor(private readonly courseModulesService: CourseModulesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar modulo de curso (admin)' })
  async create(@Body() dto: CreateModuleDto) {
    return this.courseModulesService.create(dto);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Listar modulos de um curso' })
  @ApiParam({ name: 'courseId', type: Number })
  async findByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.courseModulesService.findByCourse(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter modulo com aulas' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.courseModulesService.findOne(id);
  }

  @Patch('reorder')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reordenar modulos de um curso (admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        moduleIds: {
          type: 'array',
          items: { type: 'number' },
          example: [3, 1, 2],
          description: 'IDs dos modulos na nova ordem desejada',
        },
      },
      required: ['moduleIds'],
    },
  })
  async reorder(@Body('moduleIds') moduleIds: number[]) {
    return this.courseModulesService.reorder(moduleIds);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar modulo (admin)' })
  @ApiParam({ name: 'id', type: Number })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.courseModulesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover modulo e suas aulas (admin)' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.courseModulesService.remove(id);
  }
}
