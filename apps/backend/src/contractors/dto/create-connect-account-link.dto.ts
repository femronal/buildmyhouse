import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * For mobile apps this may be a deep link (e.g. exp://..., buildmyhouse://...),
 * so we intentionally avoid strict URL validation.
 */
export class CreateConnectAccountLinkDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  returnUrl?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  refreshUrl?: string;
}

