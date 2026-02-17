import { Injectable } from '@nestjs/common';
import { AiLlmService } from './ai-llm.service';
import {
  AiChatContext,
  AiIntent,
  AiUserContext,
} from './types/ai-intents';
import { AiToolsService } from './ai-tools.service';

interface OrchestratorResult {
  reply: string;
  intentType?: AiIntent['type'];
  performedAction?: string;
}

@Injectable()
export class AiOrchestratorService {
  constructor(
    private readonly llm: AiLlmService,
    private readonly tools: AiToolsService,
  ) {}

  async handleChat(
    message: string,
    user: AiUserContext,
    context?: AiChatContext,
  ): Promise<OrchestratorResult> {
    const { intent, assistantReply } =
      await this.llm.inferIntent(message, user, context);

    if (!intent) {
      return { reply: assistantReply };
    }

    switch (intent.type) {
      case 'GET_QUEUE_OVERVIEW': {
        const overview =
          await this.tools.getQueueOverview(intent.serviceId);
        return {
          reply:
            assistantReply +
            '\n\nQueue overview:\n' +
            JSON.stringify(overview, null, 2),
          intentType: intent.type,
        };
      }
      case 'GET_SERVICE_STATS': {
        const stats = await this.tools.getServiceStats(
          intent.serviceId,
        );
        return {
          reply:
            assistantReply +
            '\n\nService stats:\n' +
            JSON.stringify(stats, null, 2),
          intentType: intent.type,
        };
      }
      case 'CANCEL_TOKEN': {
        const token = await this.tools.cancelTokenAsAdmin(
          intent.tokenId,
          intent.reason,
        );
        return {
          reply:
            assistantReply +
            `\n\nToken ${token.tokenNumber} was cancelled.`,
          intentType: intent.type,
          performedAction: 'TOKEN_CANCELLED',
        };
      }
      case 'COMPLETE_TOKEN': {
        const token = await this.tools.completeToken(
          intent.tokenId,
        );
        return {
          reply:
            assistantReply +
            `\n\nToken ${token.tokenNumber} was marked as completed.`,
          intentType: intent.type,
          performedAction: 'TOKEN_COMPLETED',
        };
      }
      default:
        return { reply: assistantReply };
    }
  }
}

