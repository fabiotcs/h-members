import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'Maria Silva',
    description: 'Nome do usuario',
  })
  @IsString({ message: 'Nome e obrigatorio' })
  @MinLength(1, { message: 'Nome nao pode ser vazio' })
  name: string;
}
