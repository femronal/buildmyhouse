import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extname, join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { ImageCompressionService } from './image-compression.service';

type UploadResult = {
  url: string;
  key: string;
  filename: string;
  thumbnailUrl?: string | null;
  thumbnailKey?: string | null;
};

const PUBLIC_IMAGE_CACHE = 'public, max-age=31536000, immutable';

@Injectable()
export class S3UploadService {
  private readonly logger = new Logger(S3UploadService.name);
  private readonly bucket: string;
  private readonly region: string;
  private readonly publicBaseUrl: string | null;
  private readonly uploadsPrefix: string;
  private readonly s3Client: S3Client | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly imageCompressionService: ImageCompressionService,
  ) {
    this.bucket = (this.configService.get<string>('AWS_S3_BUCKET') || '').trim();
    this.region = (this.configService.get<string>('AWS_REGION') || '').trim();
    this.publicBaseUrl = (this.configService.get<string>('AWS_S3_PUBLIC_BASE_URL') || '').trim() || null;
    this.uploadsPrefix =
      (this.configService.get<string>('AWS_S3_UPLOADS_PREFIX') || 'uploads').trim().replace(/^\/+|\/+$/g, '') ||
      'uploads';

    this.s3Client =
      this.bucket && this.region
        ? new S3Client({
            region: this.region,
          })
        : null;
  }

  async uploadBuffer(params: {
    buffer: Buffer;
    folder: string;
    contentType: string;
    originalName?: string;
  }): Promise<UploadResult> {
    if (!params.buffer?.length) {
      throw new InternalServerErrorException('Upload payload is empty');
    }

    const safeFolder = params.folder.replace(/^\/+|\/+$/g, '');
    let prepared: Awaited<ReturnType<S3UploadService['preparePublicImage']>>;
    try {
      prepared = await this.preparePublicImage(params, safeFolder);
    } catch (error) {
      const extension = extname(params.originalName || '').toLowerCase() || 'none';
      this.logger.warn(
        `Image prepare failed for .${extension.replace(/^\./, '')} ${params.contentType || 'unknown'}: ${error instanceof Error ? error.message : error}`,
      );
      prepared = {
        buffer: params.buffer,
        contentType: params.contentType,
        originalName: params.originalName,
        thumbnail: null,
        cacheable: false,
      };
    }
    const extension = extname(prepared.originalName || '').toLowerCase();
    const filename = `${Date.now()}-${randomUUID()}${extension || ''}`;
    const thumbnailFilename = prepared.thumbnail
      ? filename.replace(/(\.[^.]+)$/, '.card$1')
      : null;

    if (!this.s3Client) {
      const stored = await this.uploadToLocalDisk({
        buffer: prepared.buffer,
        folder: safeFolder,
        filename,
      });
      if (prepared.thumbnail && thumbnailFilename) {
        const thumb = await this.uploadToLocalDisk({
          buffer: prepared.thumbnail,
          folder: safeFolder,
          filename: thumbnailFilename,
        });
        return { ...stored, thumbnailUrl: thumb.url, thumbnailKey: thumb.key };
      }
      return stored;
    }

    const key = `${this.uploadsPrefix}/${safeFolder}/${filename}`;
    const cacheControl = prepared.cacheable ? PUBLIC_IMAGE_CACHE : undefined;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: prepared.buffer,
        ContentType: prepared.contentType || 'application/octet-stream',
        ...(cacheControl ? { CacheControl: cacheControl } : {}),
        ...(safeFolder.includes('vendor') ? { ACL: 'private' as const } : {}),
      });
      try {
        await this.s3Client.send(command);
      } catch (error) {
        if (!safeFolder.includes('vendor')) {
          throw new InternalServerErrorException('Failed to upload file to storage');
        }
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: prepared.buffer,
            ContentType: prepared.contentType || 'application/octet-stream',
            ...(cacheControl ? { CacheControl: cacheControl } : {}),
          }),
        );
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload file to storage');
    }

    let thumbnailUrl: string | null = null;
    let thumbnailKey: string | null = null;
    if (prepared.thumbnail && thumbnailFilename) {
      thumbnailKey = `${this.uploadsPrefix}/${safeFolder}/${thumbnailFilename}`;
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: thumbnailKey,
          Body: prepared.thumbnail,
          ContentType: 'image/webp',
          CacheControl: PUBLIC_IMAGE_CACHE,
        }),
      );
      thumbnailUrl = this.publicUrl(thumbnailKey);
    }

    return { url: this.publicUrl(key), key, filename, thumbnailUrl, thumbnailKey };
  }

  private publicUrl(key: string) {
    const normalizedBase = this.publicBaseUrl?.replace(/\/+$/, '');
    return normalizedBase
      ? `${normalizedBase}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private async preparePublicImage(
    params: { buffer: Buffer; contentType: string; originalName?: string },
    folder: string,
  ): Promise<{
    buffer: Buffer;
    contentType: string;
    originalName?: string;
    thumbnail: Buffer | null;
    cacheable: boolean;
  }> {
    const viewable = await this.imageCompressionService.convertHeicToJpeg({
      buffer: params.buffer,
      contentType: params.contentType,
      originalName: params.originalName,
    });
    if (this.imageCompressionService.isPrivateFolder(folder)) {
      return {
        buffer: viewable.buffer,
        contentType: viewable.contentType,
        originalName: viewable.originalName,
        thumbnail: null,
        cacheable: false,
      };
    }
    const compressible = this.imageCompressionService.isCompressibleImage({
      mimetype: viewable.contentType,
      originalname: viewable.originalName,
      buffer: viewable.buffer,
    });
    if (!compressible) {
      return {
        buffer: viewable.buffer,
        contentType: viewable.contentType,
        originalName: viewable.originalName,
        thumbnail: null,
        cacheable: false,
      };
    }

    const prepared = await this.imageCompressionService.preparePublicPhoto(viewable.buffer);
    const baseName = (viewable.originalName || 'photo').replace(/\.[^/.]+$/, '') || 'photo';
    return {
      buffer: prepared.full,
      contentType: prepared.contentType,
      originalName: `${baseName}${prepared.extension}`,
      thumbnail: prepared.thumbnail,
      cacheable: true,
    };
  }

  /**
   * Short-lived read URL for a stored vendor file. Never returns the raw public object URL.
   */
  async signGetUrl(fileRef: string, expiresInSeconds = 300): Promise<string | null> {
    if (!fileRef) return null;
    if (fileRef.startsWith('/uploads/')) return fileRef;
    const key = this.objectKeyFromRef(fileRef);
    if (!key || !this.s3Client || !this.bucket) return null;
    try {
      return await getSignedUrl(
        this.s3Client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: expiresInSeconds },
      );
    } catch {
      return null;
    }
  }

  private objectKeyFromRef(fileRef: string): string | null {
    if (!/^https?:\/\//i.test(fileRef)) {
      return fileRef.replace(/^\/+/, '') || null;
    }
    try {
      const url = new URL(fileRef);
      const path = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
      if (url.hostname.startsWith(`${this.bucket}.`)) return path || null;
      if (path.startsWith(`${this.bucket}/`)) return path.slice(this.bucket.length + 1) || null;
      return path || null;
    } catch {
      return null;
    }
  }

  private async uploadToLocalDisk(params: {
    buffer: Buffer;
    folder: string;
    filename: string;
  }): Promise<UploadResult> {
    const dir = join(process.cwd(), 'uploads', params.folder);
    await mkdir(dir, { recursive: true });
    const absolutePath = join(dir, params.filename);
    await writeFile(absolutePath, params.buffer);

    const relative = `/uploads/${params.folder}/${params.filename}`;
    return {
      url: relative,
      key: relative.replace(/^\//, ''),
      filename: params.filename,
    };
  }
}
