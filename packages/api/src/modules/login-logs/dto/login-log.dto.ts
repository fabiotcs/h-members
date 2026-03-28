import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginLogResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiPropertyOptional({ example: 42, nullable: true })
  userId: number | null;

  @ApiPropertyOptional({ example: '192.168.1.100', nullable: true })
  ip: string | null;

  @ApiPropertyOptional({
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    nullable: true,
  })
  userAgent: string | null;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '2026-03-27T12:00:00.000Z' })
  createdAt: Date;
}

export class LoginLogWithUserDto extends LoginLogResponseDto {
  @ApiPropertyOptional({
    example: { id: 42, name: 'John Doe', email: 'john@example.com' },
    nullable: true,
  })
  user: { id: number; name: string; email: string } | null;
}

export class PaginatedLoginLogsDto {
  @ApiProperty({ type: [LoginLogResponseDto] })
  data: LoginLogResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}
