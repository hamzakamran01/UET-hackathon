import { api } from '../api';

export interface AiChatContextPayload {
  currentRoute?: string;
  serviceId?: string;
}

export interface AiChatRequestPayload {
  message: string;
  conversationId?: string;
  context?: AiChatContextPayload;
}

export interface AiChatResponsePayload {
  message: string;
  intentType?: string;
  performedAction?: string;
}

export const aiAPI = {
  sendMessage(payload: AiChatRequestPayload) {
    return api
      .post<AiChatResponsePayload>('/ai/chat', payload)
      .then((res) => res.data);
  },
};

