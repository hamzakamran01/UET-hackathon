import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { TokensModule } from './tokens/tokens.module';
import { QueueModule } from './queue/queue.module';
import { PresenceModule } from './presence/presence.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AbuseModule } from './abuse/abuse.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RedisModule } from './common/redis/redis.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Redis Module (Global)
    RedisModule,

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),

    // Task Scheduling
    ScheduleModule.forRoot(),

    // Bull Queue - with graceful error handling
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('BullModule');
        
        // Parse Redis URL if provided (Upstash format)
        const redisUrl = configService.get<string>('REDIS_URL');
        let redisConfig: any = {};

        if (redisUrl) {
          try {
            const url = new URL(redisUrl);
            redisConfig = {
              host: url.hostname,
              port: parseInt(url.port) || 6379,
              password: url.password || undefined,
              tls: url.protocol === 'rediss:' ? {} : undefined,
            };
            logger.log('Using Redis URL configuration');
          } catch (error) {
            logger.warn('Failed to parse REDIS_URL, using individual config');
          }
        }

        // Fallback to individual config
        if (!redisConfig.host) {
          const host = configService.get<string>('REDIS_HOST');
          if (host && host !== 'localhost') {
            redisConfig = {
              host,
              port: configService.get<number>('REDIS_PORT', 6379),
              password: configService.get<string>('REDIS_PASSWORD'),
              tls: host.includes('upstash.io') ? {} : undefined,
            };
          } else {
            // No Redis configured - use localhost as fallback (will fail gracefully)
            logger.warn('Redis not configured, Bull queues may not work');
            redisConfig = {
              host: 'localhost',
              port: 6379,
            };
          }
        }

        return {
          redis: {
            ...redisConfig,
            retryStrategy: (times: number) => {
              const delay = Math.min(times * 50, 2000);
              if (times > 1) {
                logger.warn(`Bull Redis retry attempt ${times}, waiting ${delay}ms`);
              }
              return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            connectTimeout: 10000,
            lazyConnect: true, // Don't block startup - connect on first use
            enableOfflineQueue: true, // Queue commands if disconnected
          },
        };
      },
      inject: [ConfigService],
    }),

    // Feature Modules
    PrismaModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    TokensModule,
    QueueModule,
    PresenceModule,
    NotificationsModule,
    AbuseModule,
    AdminModule,
    AnalyticsModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
