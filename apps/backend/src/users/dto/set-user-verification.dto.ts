import { IsBoolean } from 'class-validator';

export class SetUserVerificationDto {
  @IsBoolean()
  verified!: boolean;
}

