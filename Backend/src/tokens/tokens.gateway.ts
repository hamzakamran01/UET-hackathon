import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { RedisService } from '../common/redis/redis.service';
import Redis from 'ioredis';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/queue',
})
export class TokensGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TokensGateway.name);
  private redis: Redis | null = null;
  private redisSub: Redis | null = null;

  constructor(
    private tokensService: TokensService,
    private redisService: RedisService,
  ) {
    // Create Redis clients with error handling
    this.redis = this.redisService.createClient('tokens-gateway-pub');
    this.redisSub = this.redisService.createClient('tokens-gateway-sub');

    // Setup pub/sub if Redis is available
    if (this.redisSub) {
      try {
        // Subscribe to Redis channels for distributed events
        this.redisSub.subscribe('queue:update', 'token:update', 'token:called');

        this.redisSub.on('message', (channel, message) => {
          try {
            const data = JSON.parse(message);
            this.handleRedisMessage(channel, data);
          } catch (error) {
            this.logger.warn('Failed to parse Redis message:', error?.message);
          }
        });

        this.redisSub.on('error', (error) => {
          this.logger.warn('Redis subscriber error:', error?.message);
        });
      } catch (error) {
        this.logger.warn('Failed to setup Redis pub/sub:', error?.message);
      }
    } else {
      this.logger.warn('Redis not available, pub/sub features will be limited to single instance');
    }
  }

  handleConnection(client: Socket) {
  }

  handleDisconnect(client: Socket) {
  }

  // ==================== Client Events ====================

  @SubscribeMessage('join:service')
  async handleJoinService(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { serviceId: string },
  ) {
    client.join(`service:${data.serviceId}`);

    return {
      event: 'joined:service',
      data: { serviceId: data.serviceId },
    };
  }

  @SubscribeMessage('join:token')
  async handleJoinToken(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tokenId: string },
  ) {
    try {
      const token = await this.tokensService.findById(data.tokenId);
      client.join(`token:${data.tokenId}`);
      client.join(`service:${token.serviceId}`);

      const queueInfo = await this.tokensService.getQueuePosition(data.tokenId);

      return {
        event: 'joined:token',
        data: {
          token,
          queueInfo,
        },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: 'Failed to join token room' },
      };
    }
  }

  @SubscribeMessage('leave:token')
  async handleLeaveToken(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tokenId: string },
  ) {
    client.leave(`token:${data.tokenId}`);
    return {
      event: 'left:token',
      data: { tokenId: data.tokenId },
    };
  }

  @SubscribeMessage('get:queue_position')
  async handleGetQueuePosition(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tokenId: string },
  ) {
    try {
      const queueInfo = await this.tokensService.getQueuePosition(data.tokenId);
      return {
        event: 'queue:position',
        data: queueInfo,
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: 'Failed to retrieve queue position' },
      };
    }
  }

  // ==================== Server Events (Broadcast) ====================

  async broadcastQueueUpdate(serviceId: string) {
    const queueData = await this.getServiceQueueData(serviceId);

    // Publish to Redis for other instances (if available)
    if (this.redis) {
      try {
        await this.redis.publish(
          'queue:update',
          JSON.stringify({ serviceId, data: queueData }),
        );
      } catch (error) {
        this.logger.warn('Failed to publish to Redis:', error?.message);
      }
    }

    // Broadcast to clients
    this.server.to(`service:${serviceId}`).emit('queue:update', queueData);
  }

  async broadcastTokenUpdate(tokenId: string) {
    try {
      const token = await this.tokensService.findById(tokenId);
      const queueInfo = await this.tokensService.getQueuePosition(tokenId);

      const data = { token, queueInfo };

      // Publish to Redis (if available)
      if (this.redis) {
        try {
          await this.redis.publish('token:update', JSON.stringify({ tokenId, data }));
        } catch (error) {
          this.logger.warn('Failed to publish token update to Redis:', error?.message);
        }
      }

      // Broadcast to token room
      this.server.to(`token:${tokenId}`).emit('token:update', data);
    } catch (error) {
      this.logger.warn('Failed to broadcast token update:', error?.message);
    }
  }

  async notifyTokenCalled(tokenId: string) {
    try {
      const token = await this.tokensService.findById(tokenId);

      const data = {
        tokenId,
        tokenNumber: token.tokenNumber,
        message: 'Your turn! Please proceed to the counter.',
      };

      // Publish to Redis (if available)
      if (this.redis) {
        try {
          await this.redis.publish('token:called', JSON.stringify(data));
        } catch (error) {
          this.logger.warn('Failed to publish token called to Redis:', error?.message);
        }
      }

      // Emit to specific token
      this.server.to(`token:${tokenId}`).emit('token:your_turn', data);

      // Also broadcast to service room
      this.server.to(`service:${token.serviceId}`).emit('token:called', data);
    } catch (error) {
      this.logger.warn('Failed to notify token called:', error?.message);
    }
  }

  async notifyPresenceCheckRequired(tokenId: string) {
    this.server.to(`token:${tokenId}`).emit('presence:check_required', {
      tokenId,
      message: 'Please enable location to confirm your presence',
    });
  }

  async notifyTokenCancelled(tokenId: string, reason: string) {
    this.server.to(`token:${tokenId}`).emit('token:cancelled', {
      tokenId,
      reason,
    });
  }

  // ==================== Private Helper Methods ====================

  private async getServiceQueueData(serviceId: string) {
    const activeTokens = await this.tokensService['prisma'].token.findMany({
      where: {
        serviceId,
        status: { in: ['ACTIVE', 'CALLED'] },
      },
      select: {
        id: true,
        tokenNumber: true,
        queuePosition: true,
        status: true,
        createdAt: true,
      },
      orderBy: { queuePosition: 'asc' },
      take: 50,
    });

    return {
      serviceId,
      totalActive: activeTokens.length,
      queue: activeTokens,
      timestamp: new Date().toISOString(),
    };
  }

  private handleRedisMessage(channel: string, data: any) {
    switch (channel) {
      case 'queue:update':
        this.server.to(`service:${data.serviceId}`).emit('queue:update', data.data);
        break;
      case 'token:update':
        this.server.to(`token:${data.tokenId}`).emit('token:update', data.data);
        break;
      case 'token:called':
        this.server.to(`token:${data.tokenId}`).emit('token:your_turn', data);
        break;
    }
  }
}
