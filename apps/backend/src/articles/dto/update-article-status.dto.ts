import { IsBoolean } from 'class-validator';

export class UpdateArticleStatusDto {
  @IsBoolean()
  isPublished: boolean;
}
