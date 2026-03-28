import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SettingsService } from './settings.service';
import { UpdateSettingDto, BulkUpdateSettingsDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('settings')
@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('api/v1/settings')
  @ApiOperation({ summary: 'Obter todas as configuracoes white-label (publico)' })
  @ApiResponse({ status: 200, description: 'Configuracoes da plataforma' })
  async getAll(): Promise<Record<string, string>> {
    return this.settingsService.getAll();
  }

  @Put('api/v1/admin/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar uma configuracao (admin)' })
  @ApiResponse({ status: 200, description: 'Configuracao atualizada' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  async update(@Body() dto: UpdateSettingDto): Promise<{ success: true }> {
    await this.settingsService.set(dto.key, dto.value);
    return { success: true };
  }

  @Put('api/v1/admin/settings/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar multiplas configuracoes (admin)' })
  @ApiResponse({ status: 200, description: 'Configuracoes atualizadas' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  async bulkUpdate(
    @Body() dto: BulkUpdateSettingsDto,
  ): Promise<{ success: true; updated: number }> {
    for (const setting of dto.settings) {
      await this.settingsService.set(setting.key, setting.value);
    }
    return { success: true, updated: dto.settings.length };
  }
}
