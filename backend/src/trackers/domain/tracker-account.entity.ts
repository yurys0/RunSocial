import { TrackerAccountStatus, TrackerProviderName } from '@prisma/client';

export class TrackerAccount {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly provider: TrackerProviderName,
    readonly encryptedCredentials: string,
    private _externalUserId: string | null,
    private _status: TrackerAccountStatus,
    private _lastSyncAt: Date | null,
    readonly createdAt: Date,
  ) {}

  get externalUserId(): string | null {
    return this._externalUserId;
  }

  get status(): TrackerAccountStatus {
    return this._status;
  }

  get lastSyncAt(): Date | null {
    return this._lastSyncAt;
  }

  markSynced(at: Date, externalUserId?: string): void {
    this._lastSyncAt = at;
    this._status = TrackerAccountStatus.ACTIVE;
    if (externalUserId) {
      this._externalUserId = externalUserId;
    }
  }

  markFailed(): void {
    this._status = TrackerAccountStatus.ERROR;
  }
}
