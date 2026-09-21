import { ApiProperty } from '@nestjs/swagger';

import { Activity } from '../domain/activity.entity';

/** routePoints здесь нет: маршрут догружается отдельным резолвером. */
export class ActivityView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid', description: 'Владелец пробежки' })
  userId: string;

  @ApiProperty({ description: 'Дистанция в метрах' })
  distanceMeters: number;

  @ApiProperty({ description: 'Время движения в секундах, без пауз' })
  durationSeconds: number;

  @ApiProperty({ description: 'Средний темп: секунд на километр' })
  avgPaceSecPerKm: number;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty({ nullable: true, type: Date, description: 'Окончание по данным трекера' })
  endedAt: Date | null;

  @ApiProperty()
  likeCount: number;

  @ApiProperty({ description: 'Лайкнул ли текущий пользователь' })
  likedByMe: boolean;
}

export function toActivityView(
  activity: Activity,
  likeCount: number,
  likedByMe: boolean,
): ActivityView {
  return {
    id: activity.id,
    userId: activity.userId,
    distanceMeters: activity.distanceMeters,
    durationSeconds: activity.durationSeconds,
    avgPaceSecPerKm: activity.avgPaceSecPerKm,
    startedAt: activity.startedAt,
    endedAt: activity.endedAt,
    likeCount,
    likedByMe,
  };
}
