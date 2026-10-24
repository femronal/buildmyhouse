import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class SetPaymentModelDto {
  @IsIn(['pay_in_full', 'pay_by_stage'])
  paymentModel: 'pay_in_full' | 'pay_by_stage';

  @IsOptional()
  @IsBoolean()
  paymentComplete?: boolean;
}
