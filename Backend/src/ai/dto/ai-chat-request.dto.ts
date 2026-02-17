import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AiChatContextDto {
  @IsOptional()
  @IsString()
  currentRoute?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;
}

export class AiChatRequestDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AiChatContextDto)
  context?: AiChatContextDto;
}

