import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { StatsAggregationCron } from './cron/stats-aggregation.cron';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 300000, // 5 minutes default TTL
      max: 100, // Maximum number of items in cache
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, StatsAggregationCron],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
