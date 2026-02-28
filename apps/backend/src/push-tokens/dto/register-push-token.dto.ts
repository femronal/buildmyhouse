import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterPushTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  token: string;

  @IsString()
  @IsIn(['ios', 'android', 'web'])
  platform: string;

  @IsString()
  @IsIn(['homeowner', 'contractor'])
  app: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceId?: string;
}
