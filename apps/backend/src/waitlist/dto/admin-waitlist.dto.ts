import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { WAITLIST_PURPOSES } from '../waitlist.constants';

export class CreateWaitlistDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsIn([...WAITLIST_PURPOSES])
  purpose!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  pagePath?: string;
}

export class UpdateWaitlistDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn([...WAITLIST_PURPOSES])
  purpose?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  pagePath?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
