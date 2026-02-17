import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminJwtGuard } from '../admin/guards/admin-jwt.guard';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiChatRequestDto } from './dto/ai-chat-request.dto';
import { AiChatResponseDto } from './dto/ai-chat-response.dto';
import { AiUserContext } from './types/ai-intents';

@Controller('ai')
export class AiController {
  constructor(
    private readonly orchestrator: AiOrchestratorService,
  ) {}

  @Post('chat')
  @UseGuards(AdminJwtGuard)
  async chat(
    @Body() body: AiChatRequestDto,
    @Req() req: any,
  ): Promise<AiChatResponseDto> {
    const user = req.user as {
      sub?: string;
      id?: string;
      role?: string;
    };

    const userContext: AiUserContext = {
      id: (user?.sub as string) || (user?.id as string),
      role: user?.role,
    };

    const result = await this.orchestrator.handleChat(
      body.message,
      userContext,
      body.context,
    );

    return {
      message: result.reply,
      intentType: result.intentType,
      performedAction: result.performedAction,
    };
  }
}

