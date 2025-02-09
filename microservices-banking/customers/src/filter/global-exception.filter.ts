import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let stack: string | undefined;
    let error: string = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      error = exception.constructor.name;
      stack =
        process.env.NODE_ENV === 'development' ? exception.stack : undefined;
    } else if (exception instanceof PrismaClientKnownRequestError) {
      status = this.handlePrismaError(exception);
      message = this.getPrismaErrorMessage(exception);
      error = 'PrismaClientKnownRequestError';
      stack =
        process.env.NODE_ENV === 'development' ? exception.stack : undefined;
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.constructor.name;
      stack =
        process.env.NODE_ENV === 'development' ? exception.stack : undefined;
    }

    this.logger.error(`Exception: ${message}`, stack);

    response.status(status).json({
      statusCode: status,
      message,
      error,
      stack,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private handlePrismaError(exception: PrismaClientKnownRequestError): number {
    switch (exception.code) {
      case 'P2002':
        return HttpStatus.CONFLICT;
      case 'P2025':
        return HttpStatus.NOT_FOUND;
      case 'P2003':
        return HttpStatus.BAD_REQUEST;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private getPrismaErrorMessage(
    exception: PrismaClientKnownRequestError,
  ): string {
    switch (exception.code) {
      case 'P2002':
        const fields =
          (exception.meta?.target as string[])?.join(', ') || 'fields';
        return `A record with the same ${fields} already exists.`;
      case 'P2025':
        return 'The requested record was not found.';
      case 'P2003':
        return 'Invalid reference: the related record does not exist.';
      default:
        return 'An unexpected database error occurred.';
    }
  }
}
