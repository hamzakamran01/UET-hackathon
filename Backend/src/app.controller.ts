import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  async getHealth() {
    return this.appService.getHealth();
  }

  @Get()
  getWelcome() {
    return {
      name: 'Digital Queue Management System API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        docs: '/api/docs',
        auth: '/api/auth',
        services: '/api/services',
        tokens: '/api/tokens',
        admin: '/api/admin',
      },
    };
  }
}
