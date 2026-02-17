import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { TokensController } from './tokens.controller';
import { TokensGateway } from './tokens.gateway';

@Module({
  controllers: [TokensController],
  providers: [TokensService, TokensGateway],
  exports: [TokensService, TokensGateway],
})
export class TokensModule {}
