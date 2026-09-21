import { ApiProperty } from '@nestjs/swagger';

export class LikeCountResponseDto {
  @ApiProperty({ description: 'Число лайков после операции' })
  likeCount: number;
}
