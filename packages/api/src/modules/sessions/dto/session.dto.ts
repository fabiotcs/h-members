import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty({ description: 'Session ID', example: 1 })
  id: number;

  @ApiProperty({
    description: 'IP address of the session',
    example: '192.168.1.100',
  })
  ip: string;

  @ApiProperty({
    description: 'User-Agent string of the client',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  })
  userAgent: string;

  @ApiProperty({
    description: 'When the session was created',
    example: '2026-03-27T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the session expires',
    example: '2026-04-03T12:00:00.000Z',
  })
  expiresAt: Date;
}
