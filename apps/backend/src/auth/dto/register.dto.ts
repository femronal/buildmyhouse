import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;

  @IsString()
  @Transform(({ value }) => String(value || '').trim().toLowerCase())
  @IsIn(['homeowner', 'general_contractor', 'subcontractor', 'vendor'])
  role: string;

  @IsOptional()
  @IsString()
  phone?: string;
}



