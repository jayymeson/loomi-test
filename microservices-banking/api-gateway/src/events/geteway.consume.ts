import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class GatewayConsumer {
  private readonly logger = new Logger(GatewayConsumer.name);

  constructor(private readonly cacheService: CacheService) {}

  @RabbitSubscribe({
    exchange: 'customer-exchange',
    routingKey: 'customer.updated',
    queue: 'gateway-customer-updates',
  })
  public async handleCustomerUpdated(customer: any) {
    this.logger.log(
      `Evento recebido: customer.updated -> ${JSON.stringify(customer)}`,
    );
    this.cacheService.updateCustomer(customer);
  }
}
