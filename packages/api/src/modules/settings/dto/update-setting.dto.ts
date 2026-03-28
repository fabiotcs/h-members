import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateSettingDto {
  @ApiProperty({ example: 'platform_name', description: 'Setting key' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Minha Plataforma', description: 'Setting value' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class BulkUpdateSettingsDto {
  @ApiProperty({
    type: [UpdateSettingDto],
    description: 'Array of settings to update',
    example: [
      { key: 'platform_name', value: 'Minha Plataforma' },
      { key: 'primary_color', value: '#3B82F6' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSettingDto)
  settings: UpdateSettingDto[];
}
