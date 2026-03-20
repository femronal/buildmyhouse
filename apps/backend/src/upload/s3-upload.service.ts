import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: params.buffer,
          ContentType: params.contentType || 'application/octet-stream',
        }),
      );
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload file to storage');
    }

    const normalizedBase = this.publicBaseUrl?.replace(/\/+$/, '');
    const url = normalizedBase
      ? `${normalizedBase}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return { url, key, filename };
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
