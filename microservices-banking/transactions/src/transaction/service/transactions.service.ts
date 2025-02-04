import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTransaction(dto: CreateTransactionDto) {
    const sender = await this.prisma.user.findUnique({
      where: { id: dto.senderUserId },
    });
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverUserId },
    });

    if (!sender || !receiver) {
      throw new NotFoundException(
        'Sender or Receiver user not found in Transaction Service DB',
      );
    }

    return this.prisma.transaction.create({
      data: {
        senderUserId: dto.senderUserId,
        receiverUserId: dto.receiverUserId,
        amount: dto.amount,
        description: dto.description,
      },
      include: {
        senderUser: true,
        receiverUser: true,
      },
    });
  }
}
