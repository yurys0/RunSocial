import { IsString, MinLength } from 'class-validator';

export class SendFriendRequestDto {
  @IsString()
  @MinLength(1)
  login: string;
}
