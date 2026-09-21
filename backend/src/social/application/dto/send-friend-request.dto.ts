import { ApiProperty } from '@nestjs/swagger';
import { FriendLinkStatus } from '@prisma/client';
import { IsString, MinLength } from 'class-validator';

export class SendFriendRequestDto {
  @ApiProperty({ example: 'runner', description: 'Логин адресата заявки' })
  @IsString()
  @MinLength(1)
  login: string;
}

export class FriendRequestResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Идентификатор заявки' })
  id: string;

  @ApiProperty({ enum: FriendLinkStatus })
  status: string;
}
