import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'aluno@exemplo.com',
    description: 'E-mail cadastrado na plataforma',
  })
  @IsEmail({}, { message: 'E-mail invalido' })
  email: string;
}
