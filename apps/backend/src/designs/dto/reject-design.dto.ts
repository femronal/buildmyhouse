import { IsString, MinLength } from 'class-validator';

export class RejectDesignDto {
  @IsString()
  @MinLength(3)
  reason: string;
}
