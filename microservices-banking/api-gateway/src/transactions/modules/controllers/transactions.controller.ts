import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetUser } from 'src/decorator/get-user.decorator';
import { TransactionsService } from '../services/transactions.service';
import { CreateTransactionDto } from 'src/transactions/dto/create-transaction.dto';
import { Transaction } from 'src/transactions/interface/transaction.interface';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'User not found in Transaction DB' })
  @Post()
  async createTransaction(
    @GetUser('sub') senderUserId: string,
    @Body() createDto: CreateTransactionDto,
  ): Promise<void> {
    createDto.senderUserId = senderUserId;
    await this.transactionsService.createTransaction(createDto);
    return;
  }

  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'The transaction data' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @Get(':transactionId')
  async getTransactionById(
    @Param('transactionId') transactionId: string,
  ): Promise<Transaction> {
    return await this.transactionsService.getTransactionById(transactionId);
  }

  @ApiOperation({ summary: 'Get transactions for current user' })
  @ApiResponse({ status: 200, description: 'List of user transactions' })
  @Get()
  async getTransactionsByUserId(
    @GetUser('sub') userId: string,
  ): Promise<Transaction[]> {
    return await this.transactionsService.getTransactionsByUserId(userId);
  }

  @ApiOperation({ summary: 'Cancel a pending transaction' })
  @ApiResponse({
    status: 204,
    description: 'Transaction canceled successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':transactionId/cancel')
  async cancelTransaction(
    @Param('transactionId') transactionId: string,
  ): Promise<void> {
    await this.transactionsService.cancelTransaction(transactionId);
  }

  @ApiOperation({ summary: 'Get recent transactions' })
  @ApiResponse({ status: 200, description: 'List of recent transactions' })
  @Get('recent/:days')
  async getRecentTransactions(
    @Param('days') days: number,
  ): Promise<Transaction[]> {
    return this.transactionsService.getRecentTransactions(days);
  }
}
