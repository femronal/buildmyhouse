import {
  BadRequestException,
  Body,
  Catch,
  Controller,
  HttpException,
  PayloadTooLargeException,
  Post,
  Request,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterError } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as stageMediaProvenance from '../stages/stage-media-provenance';
import { S3UploadService } from './s3-upload.service';
import {
  FILE_TOO_LARGE_MESSAGE,
  FILE_TYPE_MESSAGE,
  IMAGE_TYPE_MESSAGE,
  MAX_DOC_BYTES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  classifyUpload,
  storedContentType,
} from './upload-types';

@Catch()
class UploadExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const code = exception instanceof MulterError
      ? exception.code
      : (exception as { code?: string } | null)?.code;
    if (code === 'LIMIT_FILE_SIZE') {
      response.status(413).json({
        statusCode: 413,
        message: FILE_TOO_LARGE_MESSAGE,
        error: 'Payload Too Large',
      });
      return;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(typeof body === 'string' ? { statusCode: status, message: body } : body);
      return;
    }
    const message = exception instanceof Error ? exception.message : 'Upload failed';
    response.status(500).json({ statusCode: 500, message });
  }
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
@UseFilters(UploadExceptionFilter)
export class UploadController {
  constructor(
    private readonly s3UploadService: S3UploadService,
    private readonly configService: ConfigService,
  ) {}

  private fingerprintFields(userId: string, url: string, sha256: string, originalSha256Raw?: string) {
    const original = typeof originalSha256Raw === 'string' ? originalSha256Raw.trim().toLowerCase() : '';
    const originalSha256 = stageMediaProvenance.isSha256Hex(original) ? original : null;
    const secret = this.configService.get<string>('JWT_SECRET') || '';
    const fingerprintToken = stageMediaProvenance.signFingerprint(secret, {
      userId,
      url,
      sha256,
      originalSha256: originalSha256 || '',
    });
    return { sha256, originalSha256, fingerprintToken };
  }

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_req, file, callback) => {
        if (classifyUpload(file) !== 'image') {
          return callback(new BadRequestException(IMAGE_TYPE_MESSAGE), false);
        }
        callback(null, true);
      },
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user?: { sub?: string } },
    @Body('originalSha256') originalSha256Raw?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const sha256 = stageMediaProvenance.sha256OfBuffer(file.buffer);
    const contentType = storedContentType(file);
    const uploaded = await this.s3UploadService.uploadBuffer({
      buffer: file.buffer,
      folder: 'images',
      contentType,
      originalName: file.originalname,
    });
    return {
      url: uploaded.url,
      thumbnailUrl: uploaded.thumbnailUrl || null,
      key: uploaded.key,
      filename: uploaded.filename,
      size: file.size,
      mimetype: contentType,
      ...this.fingerprintFields(req?.user?.sub || '', uploaded.url, sha256, originalSha256Raw),
    };
  }

  @Post(['file', 'document'])
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_req, file, callback) => {
        if (!classifyUpload(file)) {
          return callback(new BadRequestException(FILE_TYPE_MESSAGE), false);
        }
        callback(null, true);
      },
      limits: { fileSize: MAX_VIDEO_BYTES },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user?: { sub?: string } },
    @Body('originalSha256') originalSha256Raw?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const kind = classifyUpload(file);
    if (kind === 'image' && file.size > MAX_IMAGE_BYTES) {
      throw new PayloadTooLargeException('This photo is too large (max 25MB). Please choose a smaller photo.');
    }
    if (kind === 'document' && file.size > MAX_DOC_BYTES) {
      throw new PayloadTooLargeException('This document is too large (max 50MB).');
    }
    if (kind === 'video' && file.size > MAX_VIDEO_BYTES) {
      throw new PayloadTooLargeException('This video is too large (max 100MB). Please trim it or record a shorter clip.');
    }
    const sha256 = stageMediaProvenance.sha256OfBuffer(file.buffer);
    const contentType = storedContentType(file);
    const uploaded = await this.s3UploadService.uploadBuffer({
      buffer: file.buffer,
      folder: 'files',
      contentType,
      originalName: file.originalname,
    });
    return {
      url: uploaded.url,
      key: uploaded.key,
      filename: uploaded.filename,
      size: file.size,
      mimetype: contentType,
      ...this.fingerprintFields(req?.user?.sub || '', uploaded.url, sha256, originalSha256Raw),
    };
  }
}
