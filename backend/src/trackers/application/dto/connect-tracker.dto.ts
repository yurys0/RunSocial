import { ApiProperty } from '@nestjs/swagger';
import { TrackerProviderName } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class ConnectTrackerDto {
  @ApiProperty({ enum: TrackerProviderName })
  @IsEnum(TrackerProviderName)
  provider: TrackerProviderName;

  @ApiProperty({ description: 'Логин пользователя в трекере' })
  @IsString()
  @MinLength(1)
  login: string;

  @ApiProperty({ description: 'Пароль от трекера; хранится зашифрованным AES-256-GCM' })
  @IsString()
  @MinLength(1)
  password: string;
}

export class SyncAcceptedResponseDto {
  @ApiProperty({ description: 'Идентификатор задачи в очереди; ход выполнения приходит в SSE /trackers/syncs/events' })
  jobId: string;
}
