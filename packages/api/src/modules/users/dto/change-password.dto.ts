import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'SenhaAtual123',
    description: 'Senha atual do usuario',
  })
  @IsString({ message: 'Senha atual e obrigatoria' })
  currentPassword: string;

  @ApiProperty({
    example: 'NovaSenha456',
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
