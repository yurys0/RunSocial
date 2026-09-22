import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Пользователь не найден' })
  message: string;

  @ApiPropertyOptional({
    description: 'Отдельные сообщения по полям, если ошибка валидации задела несколько',
    type: [String],
  })
  details?: string[];
}
