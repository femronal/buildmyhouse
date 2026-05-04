import { IsEmail, IsIn, IsOptional } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsIn(['homeowner', 'general_contractor'])
  appRole?: 'homeowner' | 'general_contractor';
}
