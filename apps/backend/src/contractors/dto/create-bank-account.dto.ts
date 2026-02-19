import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  @MinLength(2)
  bankName: string;

  @IsString()
  @MinLength(8)
  accountNumber: string;

  @IsString()
  @MinLength(2)
  accountOwnerName: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
