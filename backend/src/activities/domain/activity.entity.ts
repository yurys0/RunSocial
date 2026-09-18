import { RoutePoint } from '../../trackers/domain/tracker-provider.interface';

export class Activity {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly trackerAccountId: string,
    readonly externalId: string,
    readonly distanceMeters: number,
    readonly durationSeconds: number,
    readonly avgPaceSecPerKm: number,
    readonly startedAt: Date,
    readonly endedAt: Date | null,
    readonly routePoints: RoutePoint[] | null,
    readonly createdAt: Date,
  ) {}
}

/** Темп считаем в домене: часть трекеров его не отдаёт, правило должно быть одно. */
export function calculateAvgPaceSecPerKm(distanceMeters: number, durationSeconds: number): number {
  if (distanceMeters <= 0) {
    return 0;
  }
  return Math.round(durationSeconds / (distanceMeters / 1000));
}
