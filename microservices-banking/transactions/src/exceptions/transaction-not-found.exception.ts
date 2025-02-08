import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class TransactionNotFoundException extends BaseException {
  constructor(message: string, stackTrace?: string) {
    super(message, HttpStatus.NOT_FOUND, stackTrace);
  }
}
