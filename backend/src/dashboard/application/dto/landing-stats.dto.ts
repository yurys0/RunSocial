import { ApiProperty } from '@nestjs/swagger';

import { StatsPeriod } from '../../domain/dashboard.types';

export class TopRunnerDto {
  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'runner' })
  login: string;

  @ApiProperty({ example: 'Иван Петров' })
  displayName: string;

  @ApiProperty({ nullable: true, type: String })
  avatarUrl: string | null;

  @ApiProperty({ description: 'Дистанция за период в метрах' })
  totalDistanceMeters: number;

  @ApiProperty({ description: 'Число пробежек за период' })
  activityCount: number;
}

export class LandingStatsDto {
  @ApiProperty({ enum: StatsPeriod })
  period: StatsPeriod;

  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  totalActivities: number;

  @ApiProperty({ description: 'Суммарная дистанция за период в метрах' })
  totalDistanceMeters: number;

  @ApiProperty({ type: [TopRunnerDto], description: 'Топ-10 по дистанции' })
  topByDistance: TopRunnerDto[];

  @ApiProperty({ type: [TopRunnerDto], description: 'Топ-10 по числу пробежек' })
  topByActivityCount: TopRunnerDto[];
}
