import { StatsPeriod } from '../domain/dashboard.types';

/** Ключи кэша собраны в одном месте — чтобы запись и инвалидация не разъезжались. */
export const CACHE_KEYS = {
  landing: (period: StatsPeriod) => `cache:dashboard:landing:${period}`,
  allLandings: () => Object.values(StatsPeriod).map((period) => CACHE_KEYS.landing(period)),
  profile: (userId: string) => `cache:profile:${userId}`,
};

export const LANDING_TTL_SECONDS = 60;
export const PROFILE_TTL_SECONDS = 30;
