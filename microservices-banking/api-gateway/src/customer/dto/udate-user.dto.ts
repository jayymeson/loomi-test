import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class BankingDetailsDto {
  @ApiProperty({ example: '1234' })
  @IsString()
  agency: string;

  @ApiProperty({ example: '56789' })
  @IsString()
  account: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'john.doe@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'P@ssw0rd!', description: 'User password' })
  @IsOptional()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message:
      'Password must be at least 8 characters with 1 letter, 1 number, and 1 special character.',
  })
  password?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: { agency: '1234', account: '56789' },
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankingDetailsDto)
  bankingDetails?: BankingDetailsDto;
}
