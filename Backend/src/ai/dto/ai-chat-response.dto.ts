import { AiIntentType } from '../types/ai-intents';

export class AiChatResponseDto {
  message!: string;
  intentType?: AiIntentType;
  performedAction?: string;
}

