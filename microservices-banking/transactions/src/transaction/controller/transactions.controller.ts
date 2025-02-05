import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { Transaction } from '@prisma/client';
import { TransactionsService } from '../service/transactions.service';

@ApiTags('transactions')
@Controller('api/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

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
  ): Promise<Transaction> {
    return this.transactionsService.createTransaction(createDto);
  }

  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'The transaction data' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @Get(':transactionId')
  async getTransactionById(
    @Param('transactionId') transactionId: string,
  ): Promise<Transaction> {
    return this.transactionsService.getTransactionById(transactionId);
  }

  @ApiOperation({ summary: 'Get transactions by user ID' })
  @ApiResponse({ status: 200, description: 'List of user transactions' })
  @Get('user/:userId')
  async getTransactionsByUserId(
    @Param('userId') userId: string,
  ): Promise<Transaction[]> {
    return this.transactionsService.getTransactionsByUserId(userId);
  }
}
