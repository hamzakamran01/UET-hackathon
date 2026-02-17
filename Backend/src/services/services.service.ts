import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) { }

  async create(data: CreateServiceDto) {
    // Convert estimatedServiceTime from minutes to seconds
    const createData = {
      ...data,
      estimatedServiceTime: data.estimatedServiceTime * 60, // Admin sends minutes, store as seconds
    };

    return this.prisma.service.create({
      data: createData,
    });
  }

  async findAll() {
    const services = await this.prisma.service.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        geofenceRadius: true,
        latitude: true,
        longitude: true,
        address: true,
        presenceGraceTime: true,
        counterReachTime: true,
        estimatedServiceTime: true, // in seconds
        maxDailyTokens: true,
        maxConcurrentTokens: true,
        _count: {
          select: {
            tokens: {
              where: { status: { in: ['ACTIVE', 'CALLED'] } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate wait times for each service
    const servicesWithWaitTime = await Promise.all(
      services.map(async (service) => {
        const activeQueueCount = service._count.tokens;

        // ESTIMATED WAIT TIME = queue count × service time (what user will see on card)
        // This shows: "If you join now, how long will you wait?"
        // Examples:
        // - 3 people waiting: 3 × 15min = 45 min (wait for all 3 ahead of you)
        const estimatedWaitSeconds = activeQueueCount * service.estimatedServiceTime;
        const estimatedWaitMinutes = Math.round(estimatedWaitSeconds / 60);

        // AVERAGE WAIT TIME = calculated from actual historical data (from database)
        // Get recent completed tokens to calculate ACTUAL average wait time
        const recentTokens = await this.prisma.token.findMany({
          where: {
            serviceId: service.id,
            status: 'COMPLETED',
            completedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
            calledAt: { not: null },
          },
          select: {
            createdAt: true,
            calledAt: true,
          },
          take: 100, // Last 100 completed tokens
        });

        // Calculate actual average wait time from timestamps
        const actualWaitTimes = recentTokens
          .filter((t) => t.calledAt)
          .map((t) => (t.calledAt!.getTime() - t.createdAt.getTime()) / 1000 / 60);

        // If no historical data, use service time as fallback (never zero!)
        // const averageWaitMinutes = actualWaitTimes.length > 0
        //   ? Math.round((actualWaitTimes.reduce((a, b) => a + b, 0) / actualWaitTimes.length) * 10) / 10
        //   : Math.round(service.estimatedServiceTime / 60); // Fallback to service time

        return {
          ...service,
          currentQueueLength: activeQueueCount,
          estimatedWaitTime: estimatedWaitMinutes, // EST. WAIT TIME (for cards)
          estimatedServiceTimeMinutes: Math.round(service.estimatedServiceTime / 60), // in minutes
        };
      })
    );

    return servicesWithWaitTime;
  }

  async findById(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        geofenceRadius: true,
        latitude: true,
        longitude: true,
        address: true,
        presenceGraceTime: true,
        counterReachTime: true,
        estimatedServiceTime: true,
        maxDailyTokens: true,
        maxConcurrentTokens: true,
        tokens: {
          where: { status: { in: ['ACTIVE', 'CALLED'] } },
          orderBy: { queuePosition: 'asc' },
          take: 10,
          select: {
            id: true,
            tokenNumber: true,
            status: true,
            queuePosition: true,
            estimatedWaitTime: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            tokens: {
              where: { status: { in: ['ACTIVE', 'CALLED'] } },
            },
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(id: string, data: UpdateServiceDto) {
    try {
      // Convert estimatedServiceTime from minutes to seconds if provided
      const updateData = { ...data };
      if (updateData.estimatedServiceTime !== undefined) {
        // Admin sends in minutes, convert to seconds for storage
        updateData.estimatedServiceTime = updateData.estimatedServiceTime * 60;
      }

      return await this.prisma.service.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      throw new NotFoundException('Service not found');
    }
  }

  async delete(id: string) {
    const activeTokens = await this.prisma.token.count({
      where: {
        serviceId: id,
        status: { in: ['ACTIVE', 'CALLED'] },
      },
    });

    if (activeTokens > 0) {
      throw new BadRequestException('Cannot delete service with active tokens');
    }

    return this.prisma.service.delete({
      where: { id },
    });
  }

  async toggleActive(id: string) {
    const service = await this.findById(id);
    return this.prisma.service.update({
      where: { id },
      data: { isActive: !service.isActive },
    });
  }

  async getServiceStats(id: string) {
    const [totalTokens, activeTokens, completedToday, recentTokens] = await Promise.all([
      this.prisma.token.count({ where: { serviceId: id } }),
      this.prisma.token.count({
        where: {
          serviceId: id,
          status: { in: ['ACTIVE', 'CALLED'] },
        },
      }),
      this.prisma.token.count({
        where: {
          serviceId: id,
          status: 'COMPLETED',
          completedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // Get tokens with actual wait times for accurate calculation
      this.prisma.token.findMany({
        where: {
          serviceId: id,
          status: 'COMPLETED',
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          calledAt: { not: null },
        },
        select: {
          createdAt: true,
          calledAt: true,
        },
      }),
    ]);

    // Calculate actual average wait time from timestamps (matches analytics)
    const actualWaitTimes = recentTokens
      .filter((t) => t.calledAt)
      .map((t) => (t.calledAt!.getTime() - t.createdAt.getTime()) / 1000 / 60);

    const averageWaitTime = actualWaitTimes.length > 0
      ? actualWaitTimes.reduce((a, b) => a + b, 0) / actualWaitTimes.length
      : 0;

    return {
      totalTokens,
      activeTokens,
      completedToday,
      averageWaitTime: Math.round(averageWaitTime * 10) / 10,
    };
  }
}
