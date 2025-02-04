import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './geteway/geteway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
