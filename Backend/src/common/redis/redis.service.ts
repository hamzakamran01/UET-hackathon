import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  url?: string;
  tls?: boolean | object;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private clients: Map<string, Redis> = new Map();
  public isConnected = false;

  constructor(private config: ConfigService) {}

  /**
   * Parse Upstash Redis URL format
   * Format: rediss://default:password@host:port
   */
  private parseRedisUrl(url: string): RedisConfig {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port) || 6379,
        password: parsed.password || undefined,
        tls: parsed.protocol === 'rediss:' ? {} : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to parse Redis URL: ${url}`, error);
      throw error;
    }
  }

  /**
   * Get Redis configuration from environment variables
   * Supports both URL format (Upstash) and separate host/port/password
   */
  private getRedisConfig(): RedisConfig | null {
    // Check for Redis URL first (Upstash format)
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        return this.parseRedisUrl(redisUrl);
      } catch (error) {
        this.logger.warn('Failed to parse REDIS_URL, falling back to individual config');
      }
    }

    // Fallback to individual config
    const host = this.config.get<string>('REDIS_HOST');
    if (!host || host === 'localhost') {
      // No Redis configured
      return null;
    }

    const port = this.config.get<number>('REDIS_PORT', 6379);
    const password = this.config.get<string>('REDIS_PASSWORD');
    const isUpstash = host.includes('upstash.io');

    return {
      host,
      port,
      password,
      tls: isUpstash ? {} : undefined,
    };
  }

  /**
   * Create a Redis client with proper error handling and retry logic
   */
  createClient(name: string = 'default'): Redis | null {
    // Return existing client if available
    if (this.clients.has(name)) {
      const client = this.clients.get(name);
      if (client && client.status === 'ready') {
        return client;
      }
      // Remove disconnected client
      this.clients.delete(name);
    }

    const config = this.getRedisConfig();
    if (!config) {
      this.logger.warn(`Redis not configured, ${name} client will not be available`);
      return null;
    }

    try {
      const redisOptions: RedisOptions = {
        host: config.host,
        port: config.port,
        password: config.password,
        ...(config.tls 
          ? { tls: typeof config.tls === 'boolean' ? {} : (config.tls as any) } 
          : {}),
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          this.logger.warn(`Redis ${name} connection retry attempt ${times}, waiting ${delay}ms`);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        connectTimeout: 10000,
        lazyConnect: false,
        showFriendlyErrorStack: true,
      };

      const client = new Redis(redisOptions);

      // Error handlers
      client.on('error', (error) => {
        this.logger.error(`Redis ${name} client error:`, error.message);
        this.isConnected = false;
        // Don't crash the app, just log the error
      });

      client.on('connect', () => {
        this.logger.log(`Redis ${name} client connecting...`);
      });

      client.on('ready', () => {
        this.logger.log(`Redis ${name} client ready`);
        this.isConnected = true;
      });

      client.on('close', () => {
        this.logger.warn(`Redis ${name} client connection closed`);
        this.isConnected = false;
      });

      client.on('reconnecting', () => {
        this.logger.log(`Redis ${name} client reconnecting...`);
      });

      // Handle connection errors gracefully
      client.on('error', (error) => {
        // Log but don't throw - allow app to continue
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          this.logger.error(
            `Redis ${name} DNS/Connection error. Check REDIS_URL or REDIS_HOST configuration.`,
          );
        }
      });

      this.clients.set(name, client);
      return client;
    } catch (error) {
      this.logger.error(`Failed to create Redis ${name} client:`, error);
      return null;
    }
  }

  /**
   * Get or create a Redis client
   */
  getClient(name: string = 'default'): Redis | null {
    const client = this.clients.get(name);
    if (client && client.status === 'ready') {
      return client;
    }
    return this.createClient(name);
  }

  /**
   * Check if Redis is available
   */
  async isAvailable(): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      return false;
    }

    try {
      await client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Safely execute a Redis command
   */
  async safeExecute<T>(
    operation: (client: Redis) => Promise<T>,
    defaultValue: T,
    operationName: string = 'operation',
  ): Promise<T> {
    const client = this.getClient();
    if (!client) {
      this.logger.debug(`Redis not available, using default value for ${operationName}`);
      return defaultValue;
    }

    try {
      return await operation(client);
    } catch (error) {
      this.logger.warn(`Redis ${operationName} failed:`, error.message);
      return defaultValue;
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    this.logger.log('Closing Redis connections...');
    for (const [name, client] of this.clients.entries()) {
      try {
        await client.quit();
        this.logger.log(`Redis ${name} client closed`);
      } catch (error) {
        this.logger.error(`Error closing Redis ${name} client:`, error);
      }
    }
    this.clients.clear();
  }
}

