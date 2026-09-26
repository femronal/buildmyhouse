import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateStartRequestDto {
  @IsIn(['repair', 'upgrade', 'build', 'interiors'])
  path!: string;

  /** JSON string so the global whitelist pipe does not strip the answer fields. */
  @IsString()
  @MinLength(2)
  @MaxLength(8000)
  answersJson!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(24)
  whatsapp!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  utmJson?: string;
}
