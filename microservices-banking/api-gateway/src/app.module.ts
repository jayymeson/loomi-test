import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UsersModule } from './customer/modules/customers.module';
import { TransactionsModule } from './transactions/modules/transactions.module';
import { AuthModule } from './auth/modules/auth.module';

@Module({
  imports: [HttpModule, UsersModule, TransactionsModule, AuthModule],
})
export class AppModule {}
