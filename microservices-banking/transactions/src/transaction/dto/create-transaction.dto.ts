import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 'uuid-sender' })
  @IsNotEmpty()
  @IsUUID()
  senderUserId: string;

  @ApiProperty({ example: 'uuid-receiver' })
  @IsNotEmpty()
  @IsUUID()
  receiverUserId: string;

  @ApiProperty({ example: 100.5 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'Payment for services', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
