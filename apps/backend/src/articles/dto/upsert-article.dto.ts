import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class ArticleFaqDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
}

class InternalLinkDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  href: string;
}

export class UpsertArticleDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  excerpt: string;

  @IsString()
  @IsNotEmpty()
  coverImageUrl: string;

  @IsString()
  @IsNotEmpty()
  coverImageAlt: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  readingMinutes: number;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsString()
  @IsNotEmpty()
  authorName: string;

  @IsString()
  @IsNotEmpty()
  canonicalPath: string;

  /** TipTap / ProseMirror JSON: { type: "doc", content: [...] } */
  @IsObject()
  content: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArticleFaqDto)
  faqs: ArticleFaqDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InternalLinkDto)
  internalLinks: InternalLinkDto[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
