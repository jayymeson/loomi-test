import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class InsufficientFundsException extends BaseException {
  constructor(message: string, stackTrace?: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, stackTrace);
  }
}
