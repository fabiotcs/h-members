import {
  Controller,
  Post,
  Get,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { AppConfigService } from '../../config';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly appConfig: AppConfigService,
  ) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login com email e senha' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login bem-sucedido',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados de login invalidos' })
  @ApiResponse({ status: 401, description: 'Credenciais invalidas' })
  @ApiResponse({ status: 403, description: 'Conta desativada' })
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as { id: number; email: string; role: string };
    const ip = req.ip ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login(user, ip, userAgent);

    const maxAge = this.parseExpiresInToMs(this.appConfig.auth.jwtExpiresIn);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: this.appConfig.app.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — invalida sessao e remove cookie' })
  @ApiResponse({ status: 200, description: 'Logout bem-sucedido' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as { id: number; sessionId: number };

    await this.authService.logout(user.sessionId);

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: this.appConfig.app.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Logout realizado com sucesso' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna perfil do usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuario',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  async me(@Req() req: Request) {
    const user = req.user as { id: number };
    return this.authService.getProfile(user.id);
  }

  /**
   * Converts JWT expiration string to milliseconds for cookie maxAge.
   */
  private parseExpiresInToMs(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      return 7 * 24 * 60 * 60 * 1000; // Default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
