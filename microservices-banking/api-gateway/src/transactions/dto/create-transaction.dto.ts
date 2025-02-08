import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsOptional,
  IsString,
  IsPositive,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 'extracted from the token' })
  @IsNotEmpty()
  @IsUUID()
  senderUserId: string;

  @ApiProperty({ example: 'uuid-receiver' })
  @IsNotEmpty()
  @IsUUID()
  receiverUserId: string;

  @ApiProperty({ example: 100.5 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'Payment for services', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
