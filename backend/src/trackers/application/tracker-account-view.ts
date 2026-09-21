import { ApiProperty } from '@nestjs/swagger';
import { TrackerAccountStatus, TrackerProviderName } from '@prisma/client';

import { TrackerAccount } from '../domain/tracker-account.entity';

export class TrackerAccountView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: TrackerProviderName })
  provider: string;

  @ApiProperty({ enum: TrackerAccountStatus, description: 'ERROR — последняя синхронизация упала' })
  status: string;

  @ApiProperty({ nullable: true, type: String, description: 'Идентификатор пользователя на стороне трекера' })
  externalUserId: string | null;

  @ApiProperty({ nullable: true, type: Date })
  lastSyncAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export function toTrackerAccountView(account: TrackerAccount): TrackerAccountView {
  return {
    id: account.id,
    provider: account.provider,
    status: account.status,
    externalUserId: account.externalUserId,
    lastSyncAt: account.lastSyncAt,
    createdAt: account.createdAt,
  };
}
