import { Test } from '@nestjs/testing';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiLlmService } from './ai-llm.service';
import { AiToolsService } from './ai-tools.service';

describe('AiOrchestratorService', () => {
  let service: AiOrchestratorService;
  let llm: { inferIntent: jest.Mock };
  let tools: {
    getQueueOverview: jest.Mock;
  };

  beforeEach(async () => {
    llm = {
      inferIntent: jest.fn(),
    };
    tools = {
      getQueueOverview: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AiOrchestratorService,
        { provide: AiLlmService, useValue: llm },
        { provide: AiToolsService, useValue: tools },
      ],
    }).compile();

    service = moduleRef.get(AiOrchestratorService);
  });

  it('returns LLM reply when no intent resolved', async () => {
    llm.inferIntent.mockResolvedValue({
      intent: null,
      assistantReply: 'Hello from AI',
    });

    const result = await service.handleChat(
      'hi',
      { id: 'admin-1' },
    );

    expect(result.reply).toContain('Hello from AI');
    expect(result.intentType).toBeUndefined();
  });

  it('calls tools for GET_QUEUE_OVERVIEW', async () => {
    llm.inferIntent.mockResolvedValue({
      intent: { type: 'GET_QUEUE_OVERVIEW' },
      assistantReply: 'Here is the overview',
    });
    tools.getQueueOverview.mockResolvedValue([
      { id: 's1', name: 'Service 1' },
    ]);

    const result = await service.handleChat(
      'show queue',
      { id: 'admin-1' },
    );

    expect(tools.getQueueOverview).toHaveBeenCalled();
    expect(result.intentType).toBe('GET_QUEUE_OVERVIEW');
    expect(result.reply).toContain('Here is the overview');
  });
});

