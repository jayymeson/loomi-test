import { HttpService } from '@nestjs/axios';
import { Injectable, HttpException } from '@nestjs/common';

import { firstValueFrom } from 'rxjs';
import { MICROSERVICES } from 'src/config/services';

@Injectable()
export class TransactionsService {
  constructor(private readonly http: HttpService) {}

  async createTransaction(data, user) {
    try {
      const response = await firstValueFrom(
        this.http.post(`${MICROSERVICES.TRANSACTIONS}`, data, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.response.data, error.response.status);
    }
  }

  async cancelTransaction(id, user) {
    try {
      const response = await firstValueFrom(
        this.http.delete(`${MICROSERVICES.TRANSACTIONS}/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
      );
      return response;
    } catch (error) {
      throw new HttpException(error.response.data, error.response.status);
    }
  }
}
