import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extname, join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';

type UploadResult = {
  url: string;
  key: string;
  filename: string;
};

@Injectable()
export class S3UploadService {
  private readonly bucket: string;
  private readonly region: string;
  private readonly publicBaseUrl: string | null;
  private readonly uploadsPrefix: string;
  private readonly s3Client: S3Client | null;

  constructor(private readonly configService: ConfigService) {
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
    const extension = extname(params.originalName || '').toLowerCase();
    const filename = `${Date.now()}-${randomUUID()}${extension || ''}`;

    if (!this.s3Client) {
      return this.uploadToLocalDisk({
        buffer: params.buffer,
        folder: safeFolder,
        filename,
      });
    }

    const key = `${this.uploadsPrefix}/${safeFolder}/${filename}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: params.buffer,
        ContentType: params.contentType || 'application/octet-stream',
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
            Body: params.buffer,
            ContentType: params.contentType || 'application/octet-stream',
          }),
        );
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload file to storage');
    }

    const normalizedBase = this.publicBaseUrl?.replace(/\/+$/, '');
    const url = normalizedBase
      ? `${normalizedBase}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return { url, key, filename };
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
