import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateSetupCheckoutSessionDto {
  /**
   * Where Stripe should redirect after a successful card save.
   * Must be a full URL (e.g. http://localhost:8081/billing-payments?setup=success)
   */
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true })
  successUrl?: string;

  /**
   * Where Stripe should redirect if the user cancels.
   * Must be a full URL (e.g. http://localhost:8081/billing-payments?setup=cancel)
   */
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true })
  cancelUrl?: string;
}

