import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetService } from './password-reset.service';

@ApiTags('Auth')
@Controller('v1/auth')
export class PasswordResetController {
  constructor(
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperacao de senha' })
  @ApiResponse({
    status: 200,
    description:
      'Mensagem generica retornada independente de o e-mail existir ou nao',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.passwordResetService.forgotPassword(dto.email);

    return {
      message:
        'Se o email estiver cadastrado, voce recebera instrucoes de recuperacao.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha com token de recuperacao' })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Token invalido ou expirado',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.passwordResetService.resetPassword(dto.token, dto.newPassword);

    return {
      message: 'Senha alterada com sucesso.',
    };
  }
}
