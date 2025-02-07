import { Injectable, HttpException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MICROSERVICES } from 'src/config/services';
import { CreateTransactionDto } from 'src/transactions/dto/create-transaction.dto';
import { Transaction } from 'src/transactions/interface/transaction.interface';

@Injectable()
export class TransactionsService {
  constructor(private readonly http: HttpService) {}

  async createTransaction(body: CreateTransactionDto): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${MICROSERVICES.TRANSACTIONS}`, body),
      );
    } catch (error) {
      throw new HttpException(error.response?.data, error.response?.status);
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
      throw error;
    }
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${MICROSERVICES.TRANSACTIONS}/user/${userId}`),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(error.response?.data, error.response?.status);
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
      throw new HttpException(error.response?.data, error.response?.status);
    }
  }

  async getRecentTransactions(days: number): Promise<Transaction[]> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${MICROSERVICES.TRANSACTIONS}/recent/${days}`),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(error.response?.data, error.response?.status);
    }
  }
}
