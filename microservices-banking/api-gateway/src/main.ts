import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './geteway/geteway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  await app.listen(3002);
}
bootstrap();
