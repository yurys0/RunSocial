import { TrackerProviderName } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class ConnectTrackerDto {
  @IsEnum(TrackerProviderName)
  provider: TrackerProviderName;

  @IsString()
  @MinLength(1)
  login: string;

  @IsString()
  @MinLength(1)
  password: string;
}
