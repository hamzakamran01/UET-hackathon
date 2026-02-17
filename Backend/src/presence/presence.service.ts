import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PresenceService {
  constructor(private prisma: PrismaService) {}

  async checkPresence(
    tokenId: string,
    latitude: number,
    longitude: number,
    accuracy?: number,
  ) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
      include: { service: true },
    });

    if (!token) {
      throw new BadRequestException('Token not found');
    }

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(
      latitude,
      longitude,
      token.service.latitude,
      token.service.longitude,
    );

    const isWithinGeofence = distance <= token.service.geofenceRadius;

    // Store presence check
    const presenceCheck = await this.prisma.presenceCheck.create({
      data: {
        tokenId,
        latitude,
        longitude,
        distanceMeters: distance,
        isWithinGeofence,
        accuracy,
        checkType: token.status === 'CALLED' ? 'AT_TURN' : 'SCHEDULED',
        isCompliant: isWithinGeofence,
      },
    });

    return {
      distance,
      isWithinGeofence,
      required: token.service.geofenceRadius,
      presenceCheck,
    };
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    // Haversine formula
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  async getTokenPresenceHistory(tokenId: string) {
    return this.prisma.presenceCheck.findMany({
      where: { tokenId },
      orderBy: { checkedAt: 'desc' },
    });
  }
}
