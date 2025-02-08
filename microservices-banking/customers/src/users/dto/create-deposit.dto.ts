import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({ example: 100, description: 'Amount to be deposited' })
  @IsNumber()
  @Min(0.01, { message: 'Deposit amount must be greater than zero.' })
  amount: number;
}
