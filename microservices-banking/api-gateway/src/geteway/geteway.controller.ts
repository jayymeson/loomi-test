import { Controller, Get, Param } from '@nestjs/common';
import { CacheService } from 'src/cache/cache.service';

@Controller('customers')
export class GatewayController {
  constructor(private readonly cacheService: CacheService) {}

  @Get(':id')
  async getCustomer(@Param('id') id: string) {
    const customer = this.cacheService.getCustomer(id);
    if (!customer) {
      return { message: 'Dados do cliente ainda não disponíveis no cache.' };
    }
    return customer;
  }
}
