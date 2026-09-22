import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { StatsPeriod } from '../../domain/dashboard.types';

export class StatsQueryDto {
  @ApiPropertyOptional({ enum: StatsPeriod, default: StatsPeriod.MONTH })
  @IsOptional()
  @IsEnum(StatsPeriod)
  period: StatsPeriod = StatsPeriod.MONTH;
}
