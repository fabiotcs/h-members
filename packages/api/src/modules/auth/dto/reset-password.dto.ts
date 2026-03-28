import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'Token de recuperacao recebido por e-mail',
  })
  @IsString({ message: 'Token e obrigatorio' })
  token: string;

  @ApiProperty({
    example: 'NovaSenha123',
    description:
      'Nova senha (minimo 8 caracteres, 1 maiuscula, 1 numero)',
  })
  @IsString({ message: 'Nova senha e obrigatoria' })
  @MinLength(8, { message: 'Senha deve ter no minimo 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Senha deve conter pelo menos 1 letra maiuscula e 1 numero',
  })
  newPassword: string;
}
