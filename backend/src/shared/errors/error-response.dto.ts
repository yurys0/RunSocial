import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({
    description: 'Текст ошибки; при ошибке валидации — массив сообщений по полям',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Пользователь не найден',
  })
  message: string | string[];

  @ApiProperty({ required: false, example: 'Bad Request', description: 'Есть только у встроенных исключений Nest' })
  error?: string;
}
