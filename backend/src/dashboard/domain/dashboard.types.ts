export enum StatsPeriod {
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  ALL = 'ALL',
}

export type TopRunner = {
  userId: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
  totalDistanceMeters: number;
  activityCount: number;
};

export type LandingStats = {
  period: StatsPeriod;
  totalUsers: number;
  totalActivities: number;
  totalDistanceMeters: number;
  topByDistance: TopRunner[];
  topByActivityCount: TopRunner[];
};
