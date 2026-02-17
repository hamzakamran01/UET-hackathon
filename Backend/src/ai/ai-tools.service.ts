import { Injectable } from '@nestjs/common';
import { ServicesService } from '../services/services.service';
import { TokensService } from '../tokens/tokens.service';

@Injectable()
export class AiToolsService {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly tokensService: TokensService,
  ) {}

  async getQueueOverview(serviceId?: string) {
    if (!serviceId) {
      const services = await this.servicesService.findAll();
      return services.map((s) => ({
        id: s.id,
        name: s.name,
        isActive: s.isActive,
        currentQueueLength: (s as any).currentQueueLength ?? 0,
        estimatedWaitTime: (s as any).estimatedWaitTime ?? 0,
      }));
    }

    const tokens = await this.tokensService.findByService(
      serviceId,
      'active',
    );

    return tokens.map((t: any) => ({
      id: t.id,
      tokenNumber: t.tokenNumber,
      status: t.status,
      queuePosition: t.queuePosition,
      serviceName: t.service?.name,
    }));
  }

  async getServiceStats(serviceId: string) {
    return this.servicesService.getServiceStats(serviceId);
  }

  async cancelTokenAsAdmin(tokenId: string, reason?: string) {
    const token = await this.tokensService.adminCancelToken(
      tokenId,
      reason,
    );

    return {
      id: token.id,
      tokenNumber: token.tokenNumber,
      status: token.status,
      serviceId: token.serviceId,
    };
  }

  async completeToken(tokenId: string) {
    const token = await this.tokensService.completeToken(tokenId);

    return {
      id: token.id,
      tokenNumber: token.tokenNumber,
      status: token.status,
      serviceId: token.serviceId,
    };
  }
}

