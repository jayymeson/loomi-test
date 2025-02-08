
import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class InvalidTransactionException extends BaseException {
  constructor(message: string, stackTrace?: string) {
    super(message, HttpStatus.BAD_REQUEST, stackTrace);
  }
}
