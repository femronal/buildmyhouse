import { IsNotEmpty, IsString } from 'class-validator';

export class VoidContractorPayoutDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
