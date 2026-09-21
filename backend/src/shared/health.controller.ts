import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Служебное')
@Controller('health')
export class HealthController {
  @ApiOperation({ summary: 'Проверка живости процесса' })
  @ApiOkResponse({ schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } } })
  @Get()
  check() {
    return { status: 'ok' };
  }
}
