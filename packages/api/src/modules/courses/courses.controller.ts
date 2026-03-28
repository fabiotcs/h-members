import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
import { UserRole } from '@prisma/client';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import {
  CourseResponseDto,
  CourseWithAccessDto,
  PaginatedCoursesDto,
} from './dto/course-response.dto';
import { ReorderCoursesDto } from './dto/reorder-courses.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('courses')
@Controller('v1/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo curso (admin)' })
  @ApiResponse({ status: 201, description: 'Curso criado', type: CourseResponseDto })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  async create(@Body() dto: CreateCourseDto): Promise<CourseResponseDto> {
    return this.coursesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cursos com paginacao e filtros' })
  @ApiResponse({ status: 200, description: 'Lista paginada de cursos', type: PaginatedCoursesDto })
  async findAll(@Query() query: CourseQueryDto): Promise<PaginatedCoursesDto> {
    return this.coursesService.findAll(query);
  }

  @Get('with-access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar cursos com info de acesso do usuario (vitrine)' })
  @ApiResponse({ status: 200, description: 'Cursos com flag de acesso', type: [CourseWithAccessDto] })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  async findAllWithAccess(@Req() req: Request): Promise<CourseWithAccessDto[]> {
    const user = req.user as { id: number };
    return this.coursesService.findAllWithAccess(user.id);
  }

  // NOTE: Static routes (reorder) must be declared before parameterized routes (:id)
  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reordenar cursos (admin)' })
  @ApiResponse({ status: 200, description: 'Cursos reordenados' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  async reorder(@Body() dto: ReorderCoursesDto) {
    return this.coursesService.reorder(dto.courseIds);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um curso' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Detalhes do curso', type: CourseResponseDto })
  @ApiResponse({ status: 404, description: 'Curso nao encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CourseResponseDto> {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar curso (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Curso atualizado', type: CourseResponseDto })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  @ApiResponse({ status: 404, description: 'Curso nao encontrado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover curso (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Curso removido' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  @ApiResponse({ status: 404, description: 'Curso nao encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.remove(id);
  }
}
