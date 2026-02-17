import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from '../admin/admin.module';
import { ServicesModule } from '../services/services.module';
import { TokensModule } from '../tokens/tokens.module';
import { AiController } from './ai.controller';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiLlmService } from './ai-llm.service';
import { AiToolsService } from './ai-tools.service';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule,
    AdminModule,
    ServicesModule,
    TokensModule,
  ],
  controllers: [AiController],
  providers: [AiOrchestratorService, AiLlmService, AiToolsService],
})
export class AiModule {}

