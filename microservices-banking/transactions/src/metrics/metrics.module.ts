import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { Counter } from 'prom-client';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: false,
      },
    }),
  ],
  providers: [
    MetricsService,
    {
      provide: 'PROM_METRIC_HTTP_REQUESTS_TOTAL',
      useFactory: (): Counter<string> => {
        return new Counter({
          name: 'http_requests_total',
          help: 'Total number of HTTP requests',
          labelNames: ['method', 'path', 'status'],
        });
      },
    },
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
