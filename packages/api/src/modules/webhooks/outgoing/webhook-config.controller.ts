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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { WebhookLogService } from '../webhook-log.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import {
  CreateWebhookConfigDto,
  UpdateWebhookConfigDto,
  WebhookConfigResponseDto,
  WebhookLogQueryDto,
  WebhookLogResponseDto,
  PaginatedWebhookLogsDto,
} from '../dto';

@ApiTags('admin/webhooks')
@Controller('v1/admin/webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class WebhookConfigController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: WebhookLogService,
  ) {}

  /**
   * List all webhook configurations.
   */
  @Get()
  @ApiOperation({ summary: 'Listar configuracoes de webhook (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de configs',
    type: [WebhookConfigResponseDto],
  })
  async findAll(): Promise<WebhookConfigResponseDto[]> {
    const configs = await this.prisma.webhookConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return configs.map((c) => ({
      id: c.id,
      url: c.url,
      events: c.events as string[],
      active: c.active,
      secret: c.secret ? '••••••••' : null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  /**
   * Create a new webhook configuration.
   */
  @Post()
  @ApiOperation({ summary: 'Criar configuracao de webhook (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Config criada',
    type: WebhookConfigResponseDto,
  })
  async create(
    @Body() dto: CreateWebhookConfigDto,
  ): Promise<WebhookConfigResponseDto> {
    const config = await this.prisma.webhookConfig.create({
      data: {
        url: dto.url,
        events: dto.events,
        active: dto.active ?? true,
        secret: dto.secret ?? null,
      },
    });
    return {
      id: config.id,
      url: config.url,
      events: config.events as string[],
      active: config.active,
      secret: config.secret ? '••••••••' : null,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Update an existing webhook configuration.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar configuracao de webhook (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Config atualizada',
    type: WebhookConfigResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Config nao encontrada' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWebhookConfigDto,
  ): Promise<WebhookConfigResponseDto> {
    const config = await this.prisma.webhookConfig.update({
      where: { id },
      data: {
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.events !== undefined && { events: dto.events }),
        ...(dto.active !== undefined && { active: dto.active }),
        ...(dto.secret !== undefined && { secret: dto.secret }),
      },
    });
    return {
      id: config.id,
      url: config.url,
      events: config.events as string[],
      active: config.active,
      secret: config.secret ? '••••••••' : null,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Delete a webhook configuration.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Remover configuracao de webhook (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Config removida' })
  @ApiResponse({ status: 404, description: 'Config nao encontrada' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.prisma.webhookConfig.delete({ where: { id } });
    return { message: 'Webhook config removed' };
  }

  /**
   * List webhook logs with pagination and filters.
   * Ref: FR-057
   */
  @Get('logs')
  @ApiOperation({ summary: 'Listar logs de webhooks (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de logs',
    type: PaginatedWebhookLogsDto,
  })
  async findLogs(
    @Query() query: WebhookLogQueryDto,
  ): Promise<PaginatedWebhookLogsDto> {
    return this.logService.findAll({
      page: query.page,
      limit: query.limit,
      direction: query.direction,
      event: query.event,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
  }
}
