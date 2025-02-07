import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Roles } from 'src/decorator/decorator.roles';
import { TransactionsService } from '../services/transactions.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard) // Protege todos os endpoints
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Roles('USER', 'ADMIN')
  createTransaction(@Body() createDto, @Req() req) {
    return this.transactionsService.createTransaction(createDto, req.user);
  }

  @Delete(':id')
  @Roles('ADMIN') // Apenas ADMIN pode cancelar transação
  cancelTransaction(@Param('id') id: string, @Req() req) {
    return this.transactionsService.cancelTransaction(id, req.user);
  }
}
