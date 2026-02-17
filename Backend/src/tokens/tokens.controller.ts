import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Query, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TokensService } from './tokens.service';
import { TokensGateway } from './tokens.gateway';
import { CreateTokenDto, CancelTokenDto } from './dto/token.dto';

@Controller('tokens')
export class TokensController {
  private readonly logger = new Logger(TokensController.name);
  constructor(
    private tokensService: TokensService,
    private tokensGateway: TokensGateway,
  ) { }

  // Public endpoint to check for existing tokens
  @Get('check-existing')
  async checkExistingToken(@Query('email') email: string, @Query('serviceId') serviceId: string) {
    return this.tokensService.checkExistingToken(email, serviceId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createToken(@Request() req, @Body() dto: CreateTokenDto) {
    const token = await this.tokensService.createToken(req.user.id, dto);

    // Broadcast queue update
    await this.tokensGateway.broadcastQueueUpdate(dto.serviceId);

    return {
      success: true,
      token,
    };
  }

  @Get('my-tokens')
  @UseGuards(JwtAuthGuard)
  async getMyTokens(@Request() req) {
    return this.tokensService.findUserTokens(req.user.id);
  }

  @Get(':id')
  async getTokenById(@Param('id') id: string) {
    try {
      this.logger?.log?.(`GET /api/tokens/${id} requested`);
      const token = await this.tokensService.findById(id);
      if (!token) {
        this.logger?.warn?.(`Token not found: ${id}`);
        throw new NotFoundException('Token not found');
      }
      return token;
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      this.logger?.error?.(`Failed to get token ${id}`, err?.stack ?? err);
      throw new InternalServerErrorException('Failed to fetch token');
    }
  }

  @Get(':id/position')
  async getQueuePosition(@Param('id') id: string) {
    return this.tokensService.getQueuePosition(id);
  }

  @Post(':id/feedback')
  async submitFeedback(@Param('id') id: string, @Body() body: { rating: number; feedback?: string }) {
    return this.tokensService.submitFeedback(id, body.rating, body.feedback);
  }


  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async cancelToken(@Request() req, @Param('id') id: string, @Body() dto: CancelTokenDto) {
    const token = await this.tokensService.cancelToken(req.user.id, id, dto.reason);

    // Broadcast updates
    await this.tokensGateway.broadcastQueueUpdate(token.serviceId);
    await this.tokensGateway.notifyTokenCancelled(id, dto.reason || 'User cancelled');

    return {
      success: true,
      message: 'Token cancelled successfully',
    };
  }
}
