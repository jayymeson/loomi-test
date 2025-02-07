import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UsersService } from './services/customers.service';
import { UsersController } from './controllers/customers.controller';
import { AuthModule } from 'src/auth/modules/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
