import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderCoursesDto {
  @ApiProperty({
    example: [3, 1, 2],
    description: 'Array of course IDs in the desired order',
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  courseIds: number[];
}
