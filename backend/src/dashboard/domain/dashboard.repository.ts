import { StatsPeriod } from './dashboard.types';

export const DASHBOARD_REPOSITORY = Symbol('DASHBOARD_REPOSITORY');

export type Totals = {
  totalUsers: number;
  totalActivities: number;
  totalDistanceMeters: number;
};

export type RunnerAggregate = {
  userId: string;
  totalDistanceMeters: number;
  activityCount: number;
};

export interface DashboardRepository {
  getTotals(period: StatsPeriod): Promise<Totals>;
  getTopByDistance(period: StatsPeriod, limit: number): Promise<RunnerAggregate[]>;
  getTopByActivityCount(period: StatsPeriod, limit: number): Promise<RunnerAggregate[]>;
}
