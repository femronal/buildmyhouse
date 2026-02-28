import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UnregisterPushTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  token: string;
}
