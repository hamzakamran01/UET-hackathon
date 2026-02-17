import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateTokenDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;
}

export class UpdateTokenLocationDto {
  @IsString()
  @IsNotEmpty()
  tokenId: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  @IsOptional()
  accuracy?: number;
}

export class CancelTokenDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
