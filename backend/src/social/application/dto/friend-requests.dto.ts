import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum FriendRequestDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export class FriendRequestsQueryDto {
  @ApiProperty({ enum: FriendRequestDirection, description: 'Чьи заявки показывать' })
  @IsEnum(FriendRequestDirection)
  direction: FriendRequestDirection;
}

export enum FriendRequestResolution {
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export class RespondFriendRequestDto {
  @ApiProperty({ enum: FriendRequestResolution, description: 'Новый статус заявки' })
  @IsEnum(FriendRequestResolution)
  status: FriendRequestResolution;
}
