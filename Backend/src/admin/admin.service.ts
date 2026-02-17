import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) { }

  async createAdmin(email: string, password: string, name: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
  }

  async validateAdmin(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return admin;
  }

  async getDashboardStats() {
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const [totalUsers, totalServices, activeTokens, completedToday] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.service.count({ where: { isActive: true } }),
      this.prisma.token.count({ where: { status: { in: ['ACTIVE', 'CALLED'] } } }),
      this.prisma.token.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: today },
        },
      }),
    ]);

    // Calculate real-time average wait time across all services
    // Logic: (Avg Service Time * Active Tokens) averaged across all active services
    const services = await this.prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        estimatedServiceTime: true,
        _count: {
          select: {
            tokens: {
              where: { status: { in: ['ACTIVE', 'CALLED'] } },
            },
          },
        },
      },
    });

    let totalWaitTime = 0;
    let activeServiceCount = 0;

    for (const service of services) {
      const activeTokens = service._count.tokens;
      if (activeTokens > 0) {
        // Wait time for this service = active tokens * service time
        totalWaitTime += activeTokens * service.estimatedServiceTime;
        activeServiceCount++;
      }
    }

    // Average wait time in minutes
    const avgWaitTime = activeServiceCount > 0
      ? Math.round((totalWaitTime / activeServiceCount) / 60)
      : 0;

    return {
      totalUsers,
      totalServices,
      activeTokens,
      completedToday,
      avgWaitTime,
      systemHealth: 100, // You can implement actual health check logic later
    };
  }

  async getRecentActivity() {
    const recentTokens = await this.prisma.token.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } },
        service: { select: { name: true } },
      },
    });

    return recentTokens.map((token) => {
      let message = '';
      let severity: 'info' | 'warning' | 'error' | 'success' = 'info';

      switch (token.status) {
        case 'COMPLETED':
          message = `Token ${token.tokenNumber} completed for ${token.service.name}`;
          severity = 'success';
          break;
        case 'CANCELLED':
          message = `Token ${token.tokenNumber} cancelled: ${token.cancellationReason || 'User cancelled'}`;
          severity = 'warning';
          break;
        case 'NO_SHOW':
          message = `No-show for token ${token.tokenNumber} in ${token.service.name}`;
          severity = 'error';
          break;
        case 'CALLED':
          message = `Token ${token.tokenNumber} called to counter in ${token.service.name}`;
          severity = 'info';
          break;
        case 'IN_SERVICE':
          message = `Token ${token.tokenNumber} currently being served in ${token.service.name}`;
          severity = 'info';
          break;
        default:
          message = `Token ${token.tokenNumber} created for ${token.service.name}`;
          severity = 'info';
      }

      return {
        id: token.id,
        type: token.status,
        message,
        timestamp: token.updatedAt.toISOString(),
        severity,
      };
    });
  }

  async getUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tokens: true,
          },
        },
      },
    });

    // Map isBlocked to isBanned for frontend compatibility
    // Add name field as null since it doesn't exist in the schema
    return users.map(user => ({
      ...user,
      name: null,
      isBanned: user.isBlocked,
    }));
  }

  async banUser(userId: string, reason: string) {
    // Update user to banned status
    await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    });

    // Log abuse
    await this.prisma.abuseLog.create({
      data: {
        userId,
        eventType: 'USER_BANNED',
        severity: 10,
        description: `User banned by admin. Reason: ${reason}`,
      },
    });

    return { success: true, message: 'User banned successfully' };
  }

  async unbanUser(userId: string) {
    // Update user to active status
    await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false },
    });

    return { success: true, message: 'User unbanned successfully' };
  }

  async verifyUserEmail(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    return { success: true, message: 'Email verified successfully' };
  }

  async verifyUserPhone(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: true },
    });

    return { success: true, message: 'Phone verified successfully' };
  }
}
