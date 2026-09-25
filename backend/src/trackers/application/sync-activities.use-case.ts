import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';

import { ImportActivitiesUseCase } from '../../activities/application/import-activities.use-case';
import { EncryptionService } from '../../shared/crypto/encryption.service';
import { RedisService } from '../../shared/redis/redis.service';
import { TrackerAccount } from '../domain/tracker-account.entity';
import {
  TRACKER_ACCOUNT_REPOSITORY,
  TrackerAccountRepository,
} from '../domain/tracker-account.repository';
import { TrackerAccountNotFoundError } from '../domain/trackers.errors';
import { TrackerProviderRegistry } from '../infrastructure/providers/tracker-provider.registry';
import { SyncProgressEvent, syncProgressChannel } from '../infrastructure/sync-queue';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class SyncActivitiesUseCase {
  private readonly logger = new Logger(SyncActivitiesUseCase.name);
  private readonly initialSyncMonths: number;
  private readonly minDistanceMeters: number;

  constructor(
    @Inject(TRACKER_ACCOUNT_REPOSITORY) private readonly accounts: TrackerAccountRepository,
    private readonly providers: TrackerProviderRegistry,
    private readonly encryption: EncryptionService,
    private readonly importActivities: ImportActivitiesUseCase,
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.initialSyncMonths = Number(config.get<string>('TRACKER_INITIAL_SYNC_MONTHS') ?? 12);
    this.minDistanceMeters = Number(config.get<string>('TRACKER_MIN_DISTANCE_METERS') ?? 0);
  }

  async execute(userId: string, trackerAccountId: string): Promise<void> {
    const account = await this.accounts.findById(trackerAccountId);
    if (!account || account.userId !== userId) {
      throw new TrackerAccountNotFoundError();
    }

    const provider = this.providers.get(account.provider);
    const publish = (event: SyncProgressEvent) =>
      this.redis.publish(syncProgressChannel(userId), event);
    const base = { trackerAccountId, provider: account.provider };

    await publish({ ...base, stage: 'started' });

    try {
      const credentials = JSON.parse(this.encryption.decrypt(account.encryptedCredentials));
      const session = await provider.authenticate(credentials);

      const fetched = await provider.fetchActivities(session, this.resolveSince(account), (done, total) => {
        void publish({ ...base, stage: 'progress', done, total });
      });

      const activities = fetched.filter(
        (activity) => activity.distanceMeters >= this.minDistanceMeters,
      );
      const skipped = fetched.length - activities.length;

      const result = await this.importActivities.execute(userId, trackerAccountId, activities);

      account.markSynced(new Date(), session.externalUserId);
      await this.accounts.save(account);

      await publish({ ...base, stage: 'done', imported: result.created, updated: result.updated });
      this.logger.log(
        `Синк ${account.provider} для ${userId}: получено ${fetched.length}, ` +
          `отброшено по дистанции ${skipped}, новых ${result.created}`,
      );
    } catch (error) {
      account.markFailed();
      await this.accounts.save(account);

      const message = error instanceof Error ? error.message : String(error);
      await publish({ ...base, stage: 'error', message });
      throw error;
    }
  }

  private resolveSince(account: TrackerAccount): Date | null {
    if (account.lastSyncAt) {
      return account.lastSyncAt;
    }
    return new Date(Date.now() - this.initialSyncMonths * 30 * DAY_MS);
  }
}
