import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { S3UploadService } from './s3-upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly s3UploadService: S3UploadService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        const ext = extname(file.originalname || '').toLowerCase();
        const allowedImageExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif']);
        const mime = (file.mimetype || '').toLowerCase();
        const isImageMime =
          mime.startsWith('image/') ||
          mime === 'application/octet-stream' ||
          mime === 'binary/octet-stream';
        if (!isImageMime || !allowedImageExts.has(ext)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const uploaded = await this.s3UploadService.uploadBuffer({
      buffer: file.buffer,
      folder: 'images',
      contentType: file.mimetype,
      originalName: file.originalname,
    });

    return {
      url: uploaded.url,
      key: uploaded.key,
      filename: uploaded.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post(['file', 'document'])
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        const allowedMimes = new Set([
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/gif',
          'image/heic',
          'image/heif',
          'video/mp4',
          'video/quicktime',
          'video/webm',
          'application/octet-stream',
          'binary/octet-stream',
        ]);
        const allowedExts = new Set([
          '.pdf',
          '.doc',
          '.docx',
          '.jpg',
          '.jpeg',
          '.png',
          '.webp',
          '.gif',
          '.heic',
          '.heif',
          '.mp4',
          '.mov',
          '.webm',
        ]);
        const ext = extname(file.originalname || '').toLowerCase();
        const mime = (file.mimetype || '').toLowerCase();
        if (!allowedMimes.has(mime) || !allowedExts.has(ext)) {
          return callback(
            new BadRequestException(
              'Only PDF, DOC, DOCX, image, and video files are allowed',
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const uploaded = await this.s3UploadService.uploadBuffer({
      buffer: file.buffer,
      folder: 'files',
      contentType: file.mimetype,
      originalName: file.originalname,
    });

    return {
      url: uploaded.url,
      key: uploaded.key,
      filename: uploaded.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}


