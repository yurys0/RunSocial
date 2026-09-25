import { Inject, Injectable } from '@nestjs/common';

import { EncryptionService } from '../../shared/crypto/encryption.service';
import {
  TRACKER_ACCOUNT_REPOSITORY,
  TrackerAccountRepository,
} from '../domain/tracker-account.repository';
import { TrackerAlreadyConnectedError } from '../domain/trackers.errors';
import { TrackerProviderRegistry } from '../infrastructure/providers/tracker-provider.registry';
import { ConnectTrackerDto } from './dto/connect-tracker.dto';
import { toTrackerAccountView, TrackerAccountView } from './tracker-account-view';

@Injectable()
export class ConnectTrackerUseCase {
  constructor(
    @Inject(TRACKER_ACCOUNT_REPOSITORY) private readonly accounts: TrackerAccountRepository,
    private readonly providers: TrackerProviderRegistry,
    private readonly encryption: EncryptionService,
  ) {}

  async execute(userId: string, dto: ConnectTrackerDto): Promise<TrackerAccountView> {
    const existing = await this.accounts.findByUserAndProvider(userId, dto.provider);
    if (existing) {
      throw new TrackerAlreadyConnectedError(dto.provider);
    }

    const provider = this.providers.get(dto.provider);
    const session = await provider.authenticate({ login: dto.login, password: dto.password });

    const account = await this.accounts.create({
      userId,
      provider: dto.provider,
      encryptedCredentials: this.encryption.encrypt(
        JSON.stringify({ login: dto.login, password: dto.password }),
      ),
      externalUserId: session.externalUserId,
    });

    return toTrackerAccountView(account);
  }
}
