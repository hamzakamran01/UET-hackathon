import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { TokensModule } from '../tokens/tokens.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'queue-management',
    }),
    TokensModule,
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
