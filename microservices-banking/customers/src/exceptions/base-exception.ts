import { HttpException, HttpStatus } from '@nestjs/common';

export class BaseException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    public readonly stackTrace?: string,
  ) {
    super(message, statusCode);
    if (stackTrace) {
      this.stack = stackTrace;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
