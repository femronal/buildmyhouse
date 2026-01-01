import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;

  @IsString()
  role: string; // 'homeowner' | 'general_contractor' | 'subcontractor' | 'vendor' | 'admin'

  @IsOptional()
  @IsString()
  phone?: string;
}



