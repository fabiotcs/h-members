import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'aluno@exemplo.com',
    description: 'E-mail do usuario',
  })
  @IsEmail({}, { message: 'E-mail invalido' })
  email: string;

  @ApiProperty({
    example: 'Senha123!',
    description:
      'Senha do usuario (minimo 8 caracteres, 1 maiuscula, 1 numero)',
  })
  @IsString({ message: 'Senha e obrigatoria' })
  @MinLength(8, { message: 'Senha deve ter no minimo 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Senha deve conter pelo menos 1 letra maiuscula e 1 numero',
  })
  password: string;
}
