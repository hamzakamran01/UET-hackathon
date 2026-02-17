import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTokenDto } from './dto/token.dto';
import { RedisService } from '../common/redis/redis.service';
import Redis from 'ioredis';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);
  private redis: Redis | null = null;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {
    // Get Redis client with error handling
    this.redis = this.redisService.createClient('tokens-service');
  }

  async createToken(userId: string, dto: CreateTokenDto) {
    // ...existing code...

    try {
      console.log('🎫 Creating token for user:', userId, 'service:', dto.serviceId);

      // OPTIMIZATION: Parallelize all independent validation queries
      // This reduces execution time from ~5-10s (sequential) to ~1-2s (parallel)
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        service,
        existingToken,
        userTokensToday,
        activeTokensCount,
        recentNoShows,
        maxPosition,
      ] = await Promise.all([
        // 1. Check if service exists and is active
        this.prisma.service.findUnique({
          where: { id: dto.serviceId },
        }),

        // 2. Check if user already has active token for this service
        this.prisma.token.findFirst({
          where: {
            userId,
            serviceId: dto.serviceId,
            status: { in: ['ACTIVE', 'CALLED'] },
          },
        }),

        // 3. Count user's tokens today
        this.prisma.token.count({
          where: {
            userId,
            createdAt: { gte: todayStart },
          },
        }),

        // 4. Check service capacity
        this.prisma.token.count({
          where: {
            serviceId: dto.serviceId,
            status: { in: ['ACTIVE', 'CALLED'] },
          },
        }),

        // 5. Check abuse history
        this.prisma.abuseLog.count({
          where: {
            userId,
            eventType: 'NO_SHOW',
            createdAt: { gte: sevenDaysAgo },
          },
        }),

        // 6. Calculate queue position
        this.prisma.token.aggregate({
          where: {
            serviceId: dto.serviceId,
            status: { in: ['ACTIVE', 'CALLED'] },
          },
          _max: { queuePosition: true },
        }),
      ]);

      console.log('✅ Validation queries complete');

      // Validation checks (fail fast)
      if (!service || !service.isActive) {
        console.log('❌ Service not available:', dto.serviceId);
        throw new BadRequestException('Service not available');
      }

      if (existingToken) {
        console.log('❌ User already has active token:', existingToken.id);
        throw new BadRequestException('You already have an active token for this service');
      }

      if (userTokensToday >= 3) {
        console.log('❌ Daily limit reached:', userTokensToday);
        throw new BadRequestException('Daily token limit reached (3 tokens per day)');
      }

      if (activeTokensCount >= service.maxConcurrentTokens) {
        console.log('❌ Service queue full:', activeTokensCount, '/', service.maxConcurrentTokens);
        throw new BadRequestException('Service queue is full. Please try again later.');
      }

      if (recentNoShows >= 3) {
        console.log('❌ User suspended due to no-shows:', recentNoShows);
        throw new ForbiddenException('Account temporarily suspended due to multiple no-shows');
      }

      // Calculate queue position
      const queuePosition = (maxPosition._max.queuePosition || 0) + 1;
      console.log('📍 Queue position calculated:', queuePosition);

      // Generate token number
      const tokenNumber = this.generateTokenNumber(service.name, queuePosition);
      console.log('🔢 Token number generated:', tokenNumber);

      // Calculate estimated wait time
      const estimatedWaitTime = (queuePosition - 1) * service.estimatedServiceTime;

      console.log('💾 Creating token in database...');

      // Create token and update service stats atomically
      const [token] = await this.prisma.$transaction([
        this.prisma.token.create({
          data: {
            tokenNumber,
            queuePosition,
            estimatedWaitTime,
            userId,
            serviceId: dto.serviceId,
          },
          include: {
            service: true,
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
              },
            },
          },
        }),
        this.prisma.service.update({
          where: { id: dto.serviceId },
          data: { totalTokensIssued: { increment: 1 } },
        }),
      ]);

      console.log('✅ Token created successfully:', token.id, token.tokenNumber);

      // Cache token in Redis (non-blocking, fire and forget)
      if (this.redis) {
        this.redis.set(
          `token:${token.id}`,
          JSON.stringify(token),
          'EX',
          24 * 60 * 60, // 24 hours
        ).catch(error => this.logger.warn('Redis cache set failed:', error.message));
      }

      // Invalidate list cache (non-blocking)
      this.invalidateServiceCache(dto.serviceId);

      console.log('🎉 Token creation complete!');
      return token;
    } catch (error) {
      // Enhanced error handling for timeout and database issues
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }

      console.error('❌ Token creation error:');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Full error:', JSON.stringify(error, null, 2));

      if (error.code === 'P2002') {
        throw new BadRequestException('Token number conflict. Please try again.');
      }

      if (error.code === 'P2003') {
        console.error('Foreign key constraint failed. User or Service not found.');
        throw new BadRequestException('Invalid user or service reference.');
      }

      if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
        throw new BadRequestException('Request timeout. Please try again.');
      }

      throw new BadRequestException('Failed to create token. Please try again.');
    }
  }


  async findById(id: string) {
    // Try Redis first
    let cached = null;
    if (this.redis) {
      try {
        cached = await this.redis.get(`token:${id}`);
      } catch (err) {
        this.logger?.warn?.(`[TokensService] Redis error for token ${id}:`, err?.message);
      }
    }
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {
        this.logger?.warn?.(`[TokensService] Failed to parse cached token ${id}:`, err?.message);
      }
    }
    // Fallback to database
    let token = null;
    try {
      token = await this.prisma.token.findUnique({
        where: { id },
        include: {
          service: true,
          user: true,
        },
      });
      this.logger?.log?.(`tokensService.findById(${id}) => ${token ? 'found' : 'not found'}`);
    } catch (err) {
      this.logger?.error?.(`[TokensService] DB error for token ${id}:`, err);
      return null;
    }
    if (!token) {
      this.logger?.warn?.(`[TokensService] Token not found: ${id}`);
      throw new NotFoundException('Token not found');
    }
    // Recalculate estimated wait time dynamically based on current service time
    const estimatedWaitTime = (token.queuePosition - 1) * token.service.estimatedServiceTime;
    const tokenWithDynamicWait = {
      ...token,
      estimatedWaitTime,
    };
    // Cache it
    if (this.redis) {
      try {
        await this.redis.set(`token:${id}`, JSON.stringify(tokenWithDynamicWait), 'EX', 24 * 60 * 60);
      } catch (error) {
        this.logger.warn('Redis cache set failed:', error?.message);
      }
    }

    return tokenWithDynamicWait;
  }

  async findUserTokens(userId: string) {
    const tokens = await this.prisma.token.findMany({
      where: { userId },
      include: { service: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Calculate dynamic wait times
    return tokens.map(token => ({
      ...token,
      estimatedWaitTime: (token.queuePosition - 1) * token.service.estimatedServiceTime,
    }));
  }

  async findAll(group: 'active' | 'completed' | 'no-show' = 'active') {
    try {
      let tokens = [];

      if (group === 'active') {
        tokens = await this.prisma.token.findMany({
          where: {
            status: { in: ['ACTIVE', 'CALLED', 'IN_SERVICE'] },
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                estimatedServiceTime: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { queuePosition: 'asc' },
          take: 500,
        });
      } else if (group === 'completed') {
        tokens = await this.prisma.token.findMany({
          where: {
            status: 'COMPLETED',
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                estimatedServiceTime: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { completedAt: 'desc' },
          take: 100,
        });
      } else if (group === 'no-show') {
        tokens = await this.prisma.token.findMany({
          where: {
            status: { in: ['CANCELLED', 'NO_SHOW', 'EXPIRED'] },
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                estimatedServiceTime: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 100,
        });
      }

      // Calculate dynamic wait times
      return tokens.map((token) => ({
        ...token,
        estimatedWaitTime:
          token.status === 'ACTIVE' || token.status === 'CALLED'
            ? (token.queuePosition - 1) * token.service.estimatedServiceTime
            : null,
      }));
    } catch (error) {
      console.error('Error fetching all tokens:', error);
      throw new BadRequestException('Failed to load queue data');
    }
  }

  async findByService(
    serviceId: string,
    group: 'active' | 'completed' | 'no-show' = 'active',
  ) {
    // 1. Check Cache (Instant Load) - Cache per group
    const cacheKey = `service:${serviceId}:tokens:${group}`;
    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.warn('Redis cache get failed:', error?.message);
      }
    }

    try {
      let tokens = [];

      if (group === 'active') {
        // Fetch active/ongoing tokens
        tokens = await this.prisma.token.findMany({
          where: {
            serviceId,
            status: { in: ['ACTIVE', 'CALLED', 'IN_SERVICE'] },
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                estimatedServiceTime: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { queuePosition: 'asc' },
          take: 500,
        });
      } else if (group === 'completed') {
        // Fetch completed tokens
        tokens = await this.prisma.token.findMany({
          where: {
            serviceId,
            status: 'COMPLETED',
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                estimatedServiceTime: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { completedAt: 'desc' },
          take: 100,
        });
      } else if (group === 'no-show') {
        // Fetch no-show/cancelled/expired tokens
        tokens = await this.prisma.token.findMany({
          where: {
            serviceId,
            status: { in: ['CANCELLED', 'NO_SHOW', 'EXPIRED'] },
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                estimatedServiceTime: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 100,
        });
      }

      // Calculate dynamic wait times (only relevant for active tokens, but safe to run for all)
      const result = tokens.map((token) => ({
        ...token,
        estimatedWaitTime:
          token.status === 'ACTIVE' || token.status === 'CALLED'
            ? (token.queuePosition - 1) * token.service.estimatedServiceTime
            : null,
      }));

      // 3. Set Cache (TTL 10s is enough for high traffic)
      if (this.redis) {
        try {
          await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 10);
        } catch (error) {
          this.logger.warn('Redis cache set failed:', error?.message);
        }
      }

      return result;
    } catch (error) {
      console.error('Error fetching tokens for service:', error);
      throw new BadRequestException('Failed to load queue data');
    }
  }

  // Helper for non-blocking cache invalidation
  private invalidateServiceCache(serviceId: string) {
    if (!this.redis) return;
    // Invalidate all groups
    const groups = ['active', 'completed', 'no-show'];
    const keys = groups.map(g => `service:${serviceId}:tokens:${g}`);
    // Fire and forget
    this.redis.del(...keys).catch(err => this.logger.warn('Cache invalidation failed:', err?.message));
  }

  async cancelToken(userId: string, tokenId: string, reason?: string) {
    const token = await this.findById(tokenId);

    if (token.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own tokens');
    }

    if (!['ACTIVE', 'CALLED'].includes(token.status)) {
      throw new BadRequestException('Token cannot be cancelled');
    }

    // Update token status
    const updatedToken = await this.prisma.token.update({
      where: { id: tokenId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || 'User cancelled',
      },
    });

    // Reorder queue (optimized)
    await this.reorderQueue(token.serviceId, token.queuePosition);

    // Clear cache
    if (this.redis) {
      this.redis.del(`token:${tokenId}`).catch(err => this.logger.warn('Redis delete failed:', err?.message));
    }
    this.invalidateServiceCache(token.serviceId);

    // Log abuse if rapid cancellation
    await this.checkRapidCancellation(userId);

    return updatedToken;
  }

  async adminCancelToken(tokenId: string, reason?: string) {
    const token = await this.findById(tokenId);

    if (!['ACTIVE', 'CALLED'].includes(token.status)) {
      throw new BadRequestException('Token cannot be cancelled');
    }

    // Update token status
    const updatedToken = await this.prisma.token.update({
      where: { id: tokenId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Cancelled by admin',
      },
    });

    // Reorder queue (optimized)
    await this.reorderQueue(token.serviceId, token.queuePosition);

    // Clear cache
    if (this.redis) {
      this.redis.del(`token:${tokenId}`).catch(err => this.logger.warn('Redis delete failed:', err?.message));
    }
    this.invalidateServiceCache(token.serviceId);

    return updatedToken;
  }

  async getQueuePosition(tokenId: string) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
      select: { serviceId: true, queuePosition: true, status: true },
    });

    if (!token || !['ACTIVE', 'CALLED'].includes(token.status)) {
      return { position: null, ahead: 0, behind: 0 };
    }

    const [ahead, behind] = await Promise.all([
      this.prisma.token.count({
        where: {
          serviceId: token.serviceId,
          status: { in: ['ACTIVE', 'CALLED'] },
          queuePosition: { lt: token.queuePosition },
        },
      }),
      this.prisma.token.count({
        where: {
          serviceId: token.serviceId,
          status: { in: ['ACTIVE', 'CALLED'] },
          queuePosition: { gt: token.queuePosition },
        },
      }),
    ]);

    return {
      position: token.queuePosition,
      ahead,
      behind,
      total: ahead + behind + 1,
    };
  }

  async reorderQueue(serviceId: string, removedPosition: number) {
    // Optimization: Use updateMany for bulk update instead of sequential loop
    // This fixes the timeout issue when completing tokens in a large queue

    // 1. Find IDs of tokens that need update (for cache invalidation)
    const tokensToUpdate = await this.prisma.token.findMany({
      where: {
        serviceId,
        status: { in: ['ACTIVE', 'CALLED'] },
        queuePosition: { gt: removedPosition },
      },
      select: { id: true },
    });

    if (tokensToUpdate.length === 0) return [];

    // 2. Perform bulk update (Atomic & Fast)
    await this.prisma.token.updateMany({
      where: {
        serviceId,
        status: { in: ['ACTIVE', 'CALLED'] },
        queuePosition: { gt: removedPosition },
      },
      data: {
        queuePosition: { decrement: 1 },
      },
    });

    // 3. Invalidate cache for affected tokens (Bulk & Safe & Non-blocking)
    if (tokensToUpdate.length > 0 && this.redis) {
      const keys = tokensToUpdate.map(t => `token:${t.id}`);
      // Fire and forget
      this.redis.del(...keys).catch(err => this.logger.warn('Redis bulk delete failed:', err?.message));
    }

    return tokensToUpdate;
  }

  async callNext(serviceId: string) {
    const nextToken = await this.prisma.token.findFirst({
      where: {
        serviceId,
        status: 'ACTIVE',
      },
      orderBy: { queuePosition: 'asc' },
    });

    if (!nextToken) {
      throw new NotFoundException('No tokens in queue');
    }

    const updatedToken = await this.prisma.token.update({
      where: { id: nextToken.id },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
      },
      include: {
        user: true,
        service: true,
      },
    });

    this.invalidateServiceCache(serviceId);
    return updatedToken;
  }

  async callNextToken(serviceId: string) {
    return this.callNext(serviceId);
  }

  async markAsInService(tokenId: string) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    if (token.status !== 'CALLED') {
      throw new BadRequestException('Token must be in CALLED status to start service');
    }

    const updatedToken = await this.prisma.token.update({
      where: { id: tokenId },
      data: {
        status: 'IN_SERVICE',
        serviceStartedAt: new Date(),
      },
      include: {
        user: true,
        service: true,
      },
    });

    this.invalidateServiceCache(token.serviceId);
    return updatedToken;
  }

  async markAsCompleted(tokenId: string) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    if (token.status !== 'IN_SERVICE') {
      throw new BadRequestException('Token must be in IN_SERVICE status to complete');
    }

    const completedToken = await this.prisma.token.update({
      where: { id: tokenId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        user: true,
        service: true,
      },
    });

    // Reorder queue after completion (optimized)
    // Note: Completed token keeps its position, but we need to shift others down?
    // Actually, if a token is completed, it leaves the queue.
    // So we should decrement position of everyone behind it.
    await this.reorderQueue(token.serviceId, token.queuePosition);

    // Clear cache
    if (this.redis) {
      this.redis.del(`token:${tokenId}`).catch(err => this.logger.warn('Redis delete failed:', err?.message));
    }
    this.invalidateServiceCache(token.serviceId);

    return completedToken;
  }

  async completeToken(tokenId: string) {
    return this.markAsCompleted(tokenId);
  }

  private generateTokenNumber(serviceName: string, position: number): string {
    const prefix = serviceName.substring(0, 2).toUpperCase();
    const number = position.toString().padStart(3, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${number}-${timestamp}`;
  }

  private async checkRapidCancellation(userId: string) {
    const recentCancellations = await this.prisma.token.count({
      where: {
        userId,
        status: 'CANCELLED',
        cancelledAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (recentCancellations >= 5) {
      await this.prisma.abuseLog.create({
        data: {
          userId,
          eventType: 'RAPID_CANCELLATION',
          severity: 5,
          description: `${recentCancellations} cancellations in last hour`,
          actionTaken: '1 hour cooldown',
        },
      });
    }
  }

  async countByStatus(statuses: string[]) {
    return this.prisma.token.count({
      where: { status: { in: statuses as any } },
    });
  }

  async countCompletedSince(date: Date) {
    return this.prisma.token.count({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: date },
      },
    });
  }

  async countAll() {
    return this.prisma.token.count();
  }

  async getRecentActivity() {
    const recentTokens = await this.prisma.token.findMany({
      take: 20,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { email: true, phone: true } },
        service: { select: { name: true } },
      },
    });

    return recentTokens.map((token) => ({
      id: token.id,
      type: 'token_update',
      message: `Token ${token.tokenNumber} - ${token.status}`,
      timestamp: token.updatedAt,
      severity: token.status === 'CANCELLED' ? 'warning' : 'info',
    }));
  }

  async checkExistingToken(email: string, serviceId: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { hasToken: false };
    }

    // Check if user has an active token for this service today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingToken = await this.prisma.token.findFirst({
      where: {
        userId: user.id,
        serviceId,
        status: { in: ['ACTIVE', 'CALLED', 'IN_SERVICE'] },
        createdAt: { gte: today },
      },
      include: {
        service: { select: { name: true } },
      },
    });

    if (existingToken) {
      return {
        hasToken: true,
        token: {
          id: existingToken.id,
          tokenNumber: existingToken.tokenNumber,
          status: existingToken.status,
          queuePosition: existingToken.queuePosition,
          serviceName: existingToken.service.name,
          createdAt: existingToken.createdAt,
        },
      };
    }

    return { hasToken: false };
  }
}
