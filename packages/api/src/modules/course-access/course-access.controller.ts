import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CourseAccessService } from './course-access.service';
import {
  GrantAccessDto,
  BulkGrantAccessDto,
  RevokeAccessDto,
} from './dto/grant-access.dto';
import {
  CheckAccessResponseDto,
  CourseAccessRecordDto,
  CourseAccessWithUserDto,
} from './dto/course-access-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('course-access')
@Controller('api/v1/course-access')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CourseAccessController {
  constructor(private readonly courseAccessService: CourseAccessService) {}

  @Get('check/:courseId')
  @ApiOperation({ summary: 'Verificar se o usuario atual tem acesso ao curso' })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Status de acesso ao curso',
    type: CheckAccessResponseDto,
  })
  async checkAccess(
    @CurrentUser('id') userId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<CheckAccessResponseDto> {
    return this.courseAccessService.checkAccessWithSalesUrl(userId, courseId);
  }

  @Get('my-courses')
  @ApiOperation({ summary: 'Listar cursos que o usuario atual tem acesso' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cursos com acesso',
  })
  async myCourses(@CurrentUser('id') userId: number) {
    return this.courseAccessService.getUserCourses(userId);
  }

  @Post('grant')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Conceder acesso a um curso (admin)' })
  @ApiResponse({ status: 201, description: 'Acesso concedido', type: CourseAccessRecordDto })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  async grantAccess(@Body() dto: GrantAccessDto): Promise<CourseAccessRecordDto> {
    return this.courseAccessService.grantAccess(
      dto.userId,
      dto.courseId,
      dto.grantedBy,
    );
  }

  @Post('grant-bulk')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Conceder acesso a multiplos cursos (admin)' })
  @ApiResponse({ status: 201, description: 'Acessos concedidos', type: [CourseAccessRecordDto] })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  async grantBulkAccess(@Body() dto: BulkGrantAccessDto): Promise<CourseAccessRecordDto[]> {
    return this.courseAccessService.bulkGrantAccess(
      dto.userId,
      dto.courseIds,
      dto.grantedBy,
    );
  }

  @Delete('revoke')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Revogar acesso a um curso (admin)' })
  @ApiResponse({ status: 200, description: 'Acesso revogado' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  @ApiResponse({ status: 404, description: 'Acesso nao encontrado' })
  async revokeAccess(@Body() dto: RevokeAccessDto) {
    return this.courseAccessService.revokeAccess(dto.userId, dto.courseId);
  }

  @Get('course/:courseId/users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar usuarios com acesso a um curso (admin)' })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios com acesso',
    type: [CourseAccessWithUserDto],
  })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  async getCourseUsers(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<CourseAccessWithUserDto[]> {
    return this.courseAccessService.getCourseUsers(courseId);
  }
}
