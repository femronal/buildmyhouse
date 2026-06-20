import { IsBoolean } from 'class-validator';

export class UpdateServicePageStatusDto {
  @IsBoolean()
  isPublished: boolean;
}
