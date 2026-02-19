import { IsString, IsUrl, MinLength } from 'class-validator';

export class SetExternalPaymentLinkDto {
  @IsString()
  @MinLength(1)
  @IsUrl({ require_protocol: true }, { message: 'externalPaymentLink must be a valid URL with protocol (e.g. https://...)' })
  externalPaymentLink: string;
}

