import {
  BadRequestException,
  Catch,
  Controller,
  HttpException,
  PayloadTooLargeException,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterError } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
  constructor(private readonly s3UploadService: S3UploadService) {}

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
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
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
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
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
    };
  }
}
