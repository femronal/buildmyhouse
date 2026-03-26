import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
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

class BaseBlockDto {
  @IsString()
  @IsIn(['heading', 'paragraph', 'bullets', 'quote', 'image', 'youtube', 'cta'])
  type: string;
}

class HeadingBlockDto extends BaseBlockDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

class ParagraphBlockDto extends BaseBlockDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

class BulletsBlockDto extends BaseBlockDto {
  @IsArray()
  @IsString({ each: true })
  items: string[];
}

class QuoteBlockDto extends BaseBlockDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  author?: string;
}

class ImageBlockDto extends BaseBlockDto {
  @IsString()
  @IsNotEmpty()
  src: string;

  @IsString()
  @IsNotEmpty()
  alt: string;

  @IsOptional()
  @IsString()
  caption?: string;
}

class YoutubeBlockDto extends BaseBlockDto {
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  caption?: string;
}

class CtaBlockDto extends BaseBlockDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  href: string;

  @IsOptional()
  @IsString()
  note?: string;
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

  @IsArray()
  @IsObject({ each: true })
  @Type(() => Object)
  blocks: Record<string, any>[];

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
