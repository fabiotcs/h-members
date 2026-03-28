import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckAccessResponseDto {
  @ApiProperty({ example: true, description: 'Se o usuario tem acesso ao curso' })
  hasAccess: boolean;

  @ApiPropertyOptional({
    example: 'https://hotmart.com/produto/123',
    description: 'URL da pagina de vendas (quando nao tem acesso)',
  })
  salesUrl?: string | null;
}

class AccessUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Joao Silva' })
  name: string;

  @ApiProperty({ example: 'joao@email.com' })
  email: string;

  @ApiProperty({ example: 'STUDENT' })
  role: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;
}

export class CourseAccessRecordDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 1 })
  courseId: number;

  @ApiProperty({ example: 'ADMIN' })
  grantedBy: string;

  @ApiProperty({ example: '2026-03-27T00:00:00.000Z' })
  grantedAt: Date;
}

export class CourseAccessWithUserDto extends CourseAccessRecordDto {
  @ApiProperty({ type: AccessUserDto })
  user: AccessUserDto;
}
