import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';

export class ParseJsonPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: any, metadata: ArgumentMetadata) {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new BadRequestException('Invalid JSON string');
    }
  }
}
