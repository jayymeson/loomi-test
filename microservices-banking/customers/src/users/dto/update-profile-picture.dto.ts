import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateProfilePictureDto {
  @ApiProperty({ example: 'https://example.com/profile.jpg' })
  @IsString()
  profilePicture: string;
}
