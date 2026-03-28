import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { LoginLogsService } from './login-logs.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  PaginatedLoginLogsDto,
  LoginLogWithUserDto,
} from './dto/login-log.dto';

@ApiTags('Admin - Login Logs')
@ApiBearerAuth()
@Controller('api/v1/admin/login-logs')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class LoginLogsController {
  constructor(private readonly loginLogsService: LoginLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List recent login logs (admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  async getRecent(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<LoginLogWithUserDto[]> {
    return this.loginLogsService.getRecent(limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get login logs for a specific user (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<PaginatedLoginLogsDto> {
    return this.loginLogsService.getByUser(userId, page, limit);
  }
}
