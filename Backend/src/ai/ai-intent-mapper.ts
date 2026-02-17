import { AiIntent } from './types/ai-intents';

interface RawIntentShape {
  type?: string;
  serviceId?: string;
  tokenId?: string;
  reason?: string;
}

export interface LlmJsonShape {
  intent?: RawIntentShape;
  assistant_reply?: string;
}

export function mapLlmIntent(raw?: RawIntentShape): AiIntent | null {
  if (!raw?.type) return null;

  switch (raw.type) {
    case 'GET_QUEUE_OVERVIEW':
      return { type: 'GET_QUEUE_OVERVIEW', serviceId: raw.serviceId };
    case 'GET_SERVICE_STATS':
      if (!raw.serviceId) return null;
      return { type: 'GET_SERVICE_STATS', serviceId: raw.serviceId };
    case 'CANCEL_TOKEN':
      if (!raw.tokenId) return null;
      return {
        type: 'CANCEL_TOKEN',
        tokenId: raw.tokenId,
        reason: raw.reason,
      };
    case 'COMPLETE_TOKEN':
      if (!raw.tokenId) return null;
      return { type: 'COMPLETE_TOKEN', tokenId: raw.tokenId };
    default:
      return null;
  }
}

