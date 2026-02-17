import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './common/redis/redis.service';

@Injectable()
export class AppService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async getHealth() {
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
    };

    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      health.services.database = 'connected';
    } catch (error) {
      health.status = 'unhealthy';
      health.services.database = 'disconnected';
      health.databaseError = error?.message;
    }

    // Check Redis connection (non-blocking)
    try {
      const redisAvailable = await this.redisService.isAvailable();
      health.services.redis = redisAvailable ? 'connected' : 'disconnected';
      if (!redisAvailable) {
        health.warnings = health.warnings || [];
        health.warnings.push('Redis is not available - caching features may be limited');
      }
    } catch (error) {
      health.services.redis = 'disconnected';
      health.warnings = health.warnings || [];
      health.warnings.push('Redis check failed - caching features may be limited');
    }

    return health;
  }
}
