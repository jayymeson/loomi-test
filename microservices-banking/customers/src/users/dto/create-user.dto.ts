import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BankingDetailsDto {
  @ApiProperty({ example: '1234' })
  @IsString()
  agency: string;

  @ApiProperty({ example: '56789' })
  @IsString()
  account: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: { agency: '1234', account: '56789' },
    required: true,
  })
  @ValidateNested()
  @Type(() => BankingDetailsDto)
  bankingDetails: BankingDetailsDto;

  @ApiProperty({ example: 'https://example.com/profile.jpg', required: false })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}
