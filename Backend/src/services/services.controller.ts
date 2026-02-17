import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  async getAllServices() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  async getServiceById(@Param('id') id: string) {
    return this.servicesService.findById(id);
  }

  @Get(':id/stats')
  async getServiceStats(@Param('id') id: string) {
    return this.servicesService.getServiceStats(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createService(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Put(':id/toggle')
  @UseGuards(JwtAuthGuard)
  async toggleServiceActive(@Param('id') id: string) {
    return this.servicesService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteService(@Param('id') id: string) {
    return this.servicesService.delete(id);
  }
}
