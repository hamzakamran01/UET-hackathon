import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiChatContext,
  AiIntent,
  AiUserContext,
} from './types/ai-intents';
import {
  LlmJsonShape,
  mapLlmIntent,
} from './ai-intent-mapper';

interface AiLlmResult {
  intent: AiIntent | null;
  assistantReply: string;
}

@Injectable()
export class AiLlmService {
  private readonly logger = new Logger(AiLlmService.name);

  constructor(private readonly config: ConfigService) { }

  async inferIntent(
    message: string,
    user: AiUserContext,
    context?: AiChatContext,
  ): Promise<AiLlmResult> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    const model =
      this.config.get<string>('GEMINI_MODEL_NAME') ??
      'gemini-1.5-pro';

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured');
      return {
        intent: null,
        assistantReply:
          'AI assistant is not configured yet. Please contact an administrator.',
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const systemPrompt =
      'You are an assistant for a digital queue management admin. ' +
      'You can only perform four operations: GET_QUEUE_OVERVIEW, GET_SERVICE_STATS, ' +
      'CANCEL_TOKEN, COMPLETE_TOKEN. Always respond with a single JSON object: ' +
      '{"intent":{"type":"GET_QUEUE_OVERVIEW","serviceId":"optional-or-null"},' +
      '"assistant_reply":"natural language reply to show user"}. ' +
      'Do not include any user PII like emails or phone numbers in assistant_reply.';

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                systemPrompt +
                '\n\n' +
                JSON.stringify({
                  message,
                  user: { role: user.role },
                  context,
                }),
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
      },
    };

    const response = await fetch(
      `${url}?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      this.logger.warn(`Gemini call failed: ${response.status}`);
      return {
        intent: null,
        assistantReply:
          'I could not process this request right now. Please try again.',
      };
    }

    const json = (await response.json()) as any;
    const text =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

    let parsed: LlmJsonShape;
    try {
      parsed = JSON.parse(text) as LlmJsonShape;
    } catch (err) {
      this.logger.warn('Failed to parse LLM JSON', err as Error);
      return {
        intent: null,
        assistantReply:
          'I could not understand this request. Please rephrase.',
      };
    }

    const intent = mapLlmIntent(parsed.intent);

    return {
      intent,
      assistantReply:
        parsed.assistant_reply ??
        'Request understood. Executing the requested action.',
    };
  }
}

