import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  private customers = new Map<string, any>();

  updateCustomer(customer: any): void {
    if (customer && customer.id) {
      this.customers.set(customer.id, customer);
    }
  }

  getCustomer(id: string): any | null {
    return this.customers.get(id) || null;
  }
}
