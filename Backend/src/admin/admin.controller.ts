import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AdminJwtGuard } from './guards/admin-jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './guards/roles.decorator';
import { AdminRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { ServicesService } from '../services/services.service';
import { TokensService } from '../tokens/tokens.service';
import { AbuseService } from '../abuse/abuse.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateServiceDto, UpdateServiceDto } from '../services/dto/service.dto';

@Controller('admin')
@UseGuards(AdminJwtGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private servicesService: ServicesService,
    private tokensService: TokensService,
    private abuseService: AbuseService,
    private notificationsService: NotificationsService,
  ) { }

  @Get('stats')
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('activity')
  async getRecentActivity() {
    return this.adminService.getRecentActivity();
  }

  // Services Management
  @Get('services')
  async getServices() {
    return this.servicesService.findAll();
  }

  @Post('services')
  async createService(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch('services/:id')
  async updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete('services/:id')
  async deleteService(@Param('id') id: string) {
    return this.servicesService.delete(id);
  }

  // Queue/Tokens Management
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

  @Post('tokens/:serviceId/call-next')
  async callNextToken(@Param('serviceId') serviceId: string) {
    return this.tokensService.callNext(serviceId);
  }

  @Patch('tokens/:tokenId/serve')
  async serveToken(@Param('tokenId') tokenId: string) {
    return this.tokensService.markAsInService(tokenId);
  }

  @Patch('tokens/:tokenId/complete')
  async completeToken(@Param('tokenId') tokenId: string) {
    return this.tokensService.markAsCompleted(tokenId);
  }

  @Delete('tokens/:tokenId')
  async cancelToken(@Param('tokenId') tokenId: string, @Body() body: { reason?: string }) {
    return this.tokensService.adminCancelToken(tokenId, body.reason);
  }

  @Post('tokens/:tokenId/notify')
  async notifyUser(@Param('tokenId') tokenId: string, @Body() body: { message: string }) {
    const token = await this.tokensService.findById(tokenId);

    const notification = await this.notificationsService.createNotification(
      token.userId,
      'SYSTEM_ALERT',
      'Message from Admin',
      body.message,
      { tokenId, tokenNumber: token.tokenNumber }
    );

    return { success: true, message: 'Notification sent', notification };
  }

  // User Management
  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Post('users/:userId/ban')
  async banUser(@Param('userId') userId: string, @Body() body: { reason: string }) {
    return this.adminService.banUser(userId, body.reason);
  }

  @Post('users/:userId/unban')
  async unbanUser(@Param('userId') userId: string) {
    return this.adminService.unbanUser(userId);
  }

  @Patch('users/:userId/verify-email')
  async verifyUserEmail(@Param('userId') userId: string) {
    return this.adminService.verifyUserEmail(userId);
  }

  @Patch('users/:userId/verify-phone')
  async verifyUserPhone(@Param('userId') userId: string) {
    return this.adminService.verifyUserPhone(userId);
  }

  // Abuse Reports
  @Get('abuse')
  async getAbuseLogs() {
    return this.abuseService.getAllAbuseLogs();
  }

  @Patch('abuse/:logId/resolve')
  async resolveAbuseLog(@Param('logId') logId: string) {
    return this.abuseService.resolveLog(logId);
  }
}
