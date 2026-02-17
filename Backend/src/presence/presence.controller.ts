import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PresenceService } from './presence.service';
import { UpdateTokenLocationDto } from '../tokens/dto/token.dto';

@Controller('presence')
@UseGuards(JwtAuthGuard)
export class PresenceController {
  constructor(private presenceService: PresenceService) {}

  @Post('check')
  async checkPresence(@Body() dto: UpdateTokenLocationDto) {
    return this.presenceService.checkPresence(
      dto.tokenId,
      dto.latitude,
      dto.longitude,
      dto.accuracy,
    );
  }

  @Get(':tokenId/history')
  async getPresenceHistory(@Param('tokenId') tokenId: string) {
    return this.presenceService.getTokenPresenceHistory(tokenId);
  }
}
