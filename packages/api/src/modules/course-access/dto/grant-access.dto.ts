import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { GrantedBy } from '@prisma/client';

export class GrantAccessDto {
  @ApiProperty({ example: 1, description: 'ID do usuario' })
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiProperty({ example: 1, description: 'ID do curso' })
  @IsInt()
  @IsPositive()
  courseId: number;

  @ApiPropertyOptional({
    enum: GrantedBy,
    example: GrantedBy.ADMIN,
    description: 'Origem da concessao',
  })
  @IsOptional()
  @IsEnum(GrantedBy)
  grantedBy?: 'ADMIN' | 'WEBHOOK';
}

export class BulkGrantAccessDto {
  @ApiProperty({ example: 1, description: 'ID do usuario' })
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Lista de IDs dos cursos',
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  courseIds: number[];

  @ApiPropertyOptional({
    enum: GrantedBy,
    example: GrantedBy.ADMIN,
    description: 'Origem da concessao',
  })
  @IsOptional()
  @IsEnum(GrantedBy)
  grantedBy?: 'ADMIN' | 'WEBHOOK';
}

export class RevokeAccessDto {
  @ApiProperty({ example: 1, description: 'ID do usuario' })
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiProperty({ example: 1, description: 'ID do curso' })
  @IsInt()
  @IsPositive()
  courseId: number;
}
