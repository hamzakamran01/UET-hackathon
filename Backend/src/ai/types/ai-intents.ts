export type AiIntentType =
  | 'GET_QUEUE_OVERVIEW'
  | 'GET_SERVICE_STATS'
  | 'CANCEL_TOKEN'
  | 'COMPLETE_TOKEN';

export interface BaseAiIntent {
  type: AiIntentType;
}

export interface GetQueueOverviewIntent extends BaseAiIntent {
  type: 'GET_QUEUE_OVERVIEW';
  serviceId?: string;
}

export interface GetServiceStatsIntent extends BaseAiIntent {
  type: 'GET_SERVICE_STATS';
  serviceId: string;
}

export interface CancelTokenIntent extends BaseAiIntent {
  type: 'CANCEL_TOKEN';
  tokenId: string;
  reason?: string;
}

export interface CompleteTokenIntent extends BaseAiIntent {
  type: 'COMPLETE_TOKEN';
  tokenId: string;
}

export type AiIntent =
  | GetQueueOverviewIntent
  | GetServiceStatsIntent
  | CancelTokenIntent
  | CompleteTokenIntent;

export interface AiUserContext {
  id: string;
  role?: string;
}

export interface AiChatContext {
  currentRoute?: string;
  serviceId?: string;
}

