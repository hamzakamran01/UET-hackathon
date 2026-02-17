import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  maxDailyTokens: number;

  @IsNumber()
  @Min(1)
  maxConcurrentTokens: number;

  @IsNumber()
  @Min(10)
  geofenceRadius: number;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @Min(30)
  presenceGraceTime: number;

  @IsNumber()
  @Min(30)
  counterReachTime: number;

  @IsNumber()
  @Min(1)  // Minimum 1 minute
  estimatedServiceTime: number;  // In MINUTES (will be converted to seconds)
}

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxDailyTokens?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxConcurrentTokens?: number;

  @IsNumber()
  @Min(10)
  @IsOptional()
  geofenceRadius?: number;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @Min(30)
  @IsOptional()
  presenceGraceTime?: number;

  @IsNumber()
  @Min(30)
  @IsOptional()
  counterReachTime?: number;

  @IsNumber()
  @Min(1)  // Minimum 1 minute
  @IsOptional()
  estimatedServiceTime?: number;  // In MINUTES (will be converted to seconds)

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
