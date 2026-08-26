import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class JoinWaitlistDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  productKey!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  sourcePath?: string;
}
