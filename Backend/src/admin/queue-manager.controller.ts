import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { AdminJwtGuard } from './guards/admin-jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './guards/roles.decorator';
import { AdminRole } from '@prisma/client';
import { TokensService } from '../tokens/tokens.service';
import { ServicesService } from '../services/services.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('queue-manager')
@UseGuards(AdminJwtGuard, RolesGuard)
@Roles(AdminRole.MODERATOR)
export class QueueManagerController {
  constructor(
    private tokensService: TokensService,
    private servicesService: ServicesService,
    private notificationsService: NotificationsService,
  ) { }

  // Get queue manager's assigned services
  @Get('services')
  async getMyServices(@Request() req) {
    // For now, return all active services
    // In production, you'd filter by assigned services stored in Admin model
    return this.servicesService.findAll();
  }

  // Get service details
  @Get('services/:id')
  async getServiceById(@Param('id') id: string) {
    return this.servicesService.findById(id);
  }

  // Get service stats
  @Get('services/:id/stats')
  async getServiceStats(@Param('id') id: string) {
    return this.servicesService.getServiceStats(id);
  }

  // Get tokens for queue management
  @Get('tokens')
  async getTokens(
    @Query('serviceId') serviceId?: string,
    @Query('group') group: 'active' | 'completed' | 'no-show' = 'active',
  ) {
    if (serviceId) {
      return this.tokensService.findByService(serviceId, group);
    }
    return this.tokensService.findAll(group);
  }

  // Call next token in queue
  @Post('tokens/:serviceId/call-next')
  async callNextToken(@Param('serviceId') serviceId: string) {
    return this.tokensService.callNext(serviceId);
  }

  // Mark token as in service
  @Patch('tokens/:tokenId/serve')
  async serveToken(@Param('tokenId') tokenId: string) {
    return this.tokensService.markAsInService(tokenId);
  }

  // Complete token
  @Patch('tokens/:tokenId/complete')
  async completeToken(@Param('tokenId') tokenId: string) {
    return this.tokensService.markAsCompleted(tokenId);
  }

  // Send notification to user
  @Post('tokens/:tokenId/notify')
  async notifyUser(@Param('tokenId') tokenId: string, @Body() body: { message: string }) {
    const token = await this.tokensService.findById(tokenId);

    const notification = await this.notificationsService.createNotification(
      token.userId,
      'SYSTEM_ALERT',
      'Message from Queue Manager',
      body.message,
      { tokenId, tokenNumber: token.tokenNumber }
    );

    return { success: true, message: 'Notification sent', notification };
  }

  // Get dashboard stats (limited to assigned services)
  @Get('stats')
  async getStats(@Request() req) {
    // Get all tokens for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeTokens, completedToday, totalTokens] = await Promise.all([
      this.tokensService.countByStatus(['ACTIVE', 'CALLED', 'IN_SERVICE']),
      this.tokensService.countCompletedSince(today),
      this.tokensService.countAll(),
    ]);

    return {
      activeTokens,
      completedToday,
      totalTokens,
      avgWaitTime: 0, // Calculate from service stats
    };
  }

  // Get recent activity (queue-specific)
  @Get('activity')
  async getRecentActivity() {
    // Return recent token activities
    return this.tokensService.getRecentActivity();
  }
}
