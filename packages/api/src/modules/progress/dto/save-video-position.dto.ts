import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveVideoPositionDto {
  @ApiProperty({
    example: 120,
    description: 'Posicao do video em segundos para resume playback',
  })
  @IsInt()
  @Min(0)
  position: number;
}
