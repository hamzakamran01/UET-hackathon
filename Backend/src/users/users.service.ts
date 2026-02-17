import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        tokens: {
          where: { status: { in: ['ACTIVE', 'CALLED'] } },
          include: { service: true },
          orderBy: { createdAt: 'desc' },
        },
        abuseLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async blockUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isBlocked: true },
    });
  }

  async unblockUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isBlocked: false },
    });
  }

  async getUserStats(userId: string) {
    const [totalTokens, completedTokens, cancelledTokens, noShows] = await Promise.all([
      this.prisma.token.count({ where: { userId } }),
      this.prisma.token.count({ where: { userId, status: 'COMPLETED' } }),
      this.prisma.token.count({ where: { userId, status: 'CANCELLED' } }),
      this.prisma.token.count({ where: { userId, status: 'NO_SHOW' } }),
    ]);

    return {
      totalTokens,
      completedTokens,
      cancelledTokens,
      noShows,
      completionRate: totalTokens > 0 ? (completedTokens / totalTokens) * 100 : 0,
    };
  }
}
