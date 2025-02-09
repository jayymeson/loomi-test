import {
  Injectable,
  HttpException,
  NotFoundException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MICROSERVICES } from 'src/config/services';
import { CreateTransactionDto } from 'src/transactions/dto/create-transaction.dto';
import { Transaction } from 'src/transactions/interface/transaction.interface';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private readonly http: HttpService) {}

  private handleMicroserviceError(error: any, context: string) {
    this.logger.error(`Error in ${context}: ${error.message}`, error.stack);
    const statusCode =
      error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const errorData = error.response?.data || {
      message: 'Internal server error',
      error: 'UnknownError',
    };

    const response = {
      statusCode,
      message: errorData.message || 'Internal server error',
      error: errorData.error || 'UnknownError',
      timestamp: errorData.timestamp || new Date().toISOString(),
      path: errorData.path || 'unknown',
      stack:
        process.env.NODE_ENV === 'development'
          ? errorData.stack || error.stack
          : undefined,
    };

    throw new HttpException(response, statusCode);
  }

  async createTransaction(body: CreateTransactionDto): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${MICROSERVICES.TRANSACTIONS}`, body),
      );
    } catch (error) {
      this.handleMicroserviceError(error, 'createTransaction');
    }
  }

  async getTransactionById(transactionId: string): Promise<Transaction> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${MICROSERVICES.TRANSACTIONS}/${transactionId}`),
      );

      if (!response.data) {
        throw new NotFoundException('Transaction not found');
      }

      return response.data;
    } catch (error) {
      this.handleMicroserviceError(error, 'getTransactionById');
    }
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${MICROSERVICES.TRANSACTIONS}/user/${userId}`),
      );
      return response.data;
    } catch (error) {
      this.handleMicroserviceError(error, 'getTransactionsByUserId');
    }
  }

  async cancelTransaction(transactionId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(
          `${MICROSERVICES.TRANSACTIONS}/${transactionId}/cancel`,
          {},
        ),
      );
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Transaction not found');
      }
      this.handleMicroserviceError(error, 'cancelTransaction');
    }
  }

  async getRecentTransactions(days: number): Promise<Transaction[]> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${MICROSERVICES.TRANSACTIONS}/recent/${days}`),
      );
      return response.data;
    } catch (error) {
      this.handleMicroserviceError(error, 'getRecentTransactions');
    }
  }
}
