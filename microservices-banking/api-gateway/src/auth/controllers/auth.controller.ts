import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/decorator/decorator.roles';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { TransactionsService } from 'src/transactions/modules/services/transactions.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Roles('USER', 'ADMIN')
  createTransaction(@Body() createDto, @Req() req) {
    return this.transactionsService.createTransaction(createDto, req.user);
  }

  @Delete(':id')
  @Roles('ADMIN')
  cancelTransaction(@Param('id') id: string, @Req() req) {
    return this.transactionsService.cancelTransaction(id, req.user);
  }
}
