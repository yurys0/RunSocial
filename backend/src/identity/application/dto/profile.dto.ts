import { IsBoolean, IsIn, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName: string;
}

export class UpdatePrivacyDto {
  @IsBoolean()
  isPrivate: boolean;
}

export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export class CreateAvatarUploadUrlDto {
  @IsIn(ALLOWED_AVATAR_TYPES)
  contentType: string;

  @IsInt()
  @Min(1)
  @Max(MAX_AVATAR_BYTES)
  contentLength: number;
}

export class ConfirmAvatarDto {
  @IsString()
  @MinLength(1)
  key: string;
}
