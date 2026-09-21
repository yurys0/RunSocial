import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Служебное')
@Controller('health')
export class HealthController {
  @ApiOperation({ summary: 'Проверка живости процесса' })
  @Get()
  check() {
    return { status: 'ok' };
  }
}
