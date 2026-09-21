import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SendFriendRequestDto {
  @ApiProperty({ example: 'runner', description: 'Логин адресата заявки' })
  @IsString()
  @MinLength(1)
  login: string;
}
