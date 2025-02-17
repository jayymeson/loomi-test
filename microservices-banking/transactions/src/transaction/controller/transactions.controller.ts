import { Controller, Get, Post, Param, Body, Patch } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { Transaction } from '@prisma/client';
import { TransactionsService } from '../service/transactions.service';
import { MetricsService } from 'src/metrics/metrics.service';

@ApiTags('transactions')
@Controller('api/transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly metricsService: MetricsService,
  ) {}

  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'User Not Found in Transaction DB' })
  @Post()
  async createTransaction(
    @Body() createDto: CreateTransactionDto,
  ): Promise<void> {
    this.metricsService.increment();
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
    this.metricsService.increment();
    return this.transactionsService.getTransactionById(transactionId);
  }

  @ApiOperation({ summary: 'Get transactions by user ID' })
  @ApiResponse({ status: 200, description: 'List of user transactions' })
  @Get('user/:userId')
  async getTransactionsByUserId(
    @Param('userId') userId: string,
  ): Promise<Transaction[]> {
    this.metricsService.increment();
    return this.transactionsService.getTransactionsByUserId(userId);
  }

  @ApiOperation({ summary: 'Cancel a pending transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction canceled successfully',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 422, description: 'Transaction cannot be canceled' })
  @Patch(':transactionId/cancel')
  async cancelTransaction(
    @Param('transactionId') transactionId: string,
  ): Promise<void> {
    this.metricsService.increment();
    await this.transactionsService.cancelTransaction(transactionId);
  }

  @ApiOperation({ summary: 'Get recent transactions' })
  @ApiResponse({ status: 200, description: 'List of recent transactions' })
  @Get('recent/:days')
  async getRecentTransactions(
    @Param('days') days: number,
  ): Promise<Transaction[]> {
    this.metricsService.increment();
    return this.transactionsService.getRecentTransactions(days);
  }
}
