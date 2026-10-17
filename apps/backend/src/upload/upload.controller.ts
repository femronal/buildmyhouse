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
  private static readonly ALLOWED_IMAGE_EXTS = new Set([
    '.jpg',
    '.jpeg',
    '.jpe',
    '.png',
    '.webp',
    '.gif',
    '.heic',
    '.heif',
    '.dng',
    '.tif',
    '.tiff',
    '.bmp',
    '.avif',
    '.jfif',
    '.jxl',
  ]);

  private static isAcceptedImage(file: { originalname?: string; mimetype?: string }): boolean {
    const ext = extname(file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    if (mime.startsWith('image/')) return true;
    if (mime === 'application/octet-stream' || mime === 'binary/octet-stream') {
      return UploadController.ALLOWED_IMAGE_EXTS.has(ext);
    }
    return false;
  }

  constructor(private readonly s3UploadService: S3UploadService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        if (!UploadController.isAcceptedImage(file)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max to support high-resolution phone images (including RAW/DNG)
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
      thumbnailUrl: uploaded.thumbnailUrl || null,
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
        const allowedDocumentMimes = new Set([
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'video/mp4',
          'video/quicktime',
          'video/webm',
        ]);
        const allowedDocumentExts = new Set([
          '.pdf',
          '.doc',
          '.docx',
          '.mp4',
          '.mov',
          '.webm',
        ]);
        const ext = extname(file.originalname || '').toLowerCase();
        const mime = (file.mimetype || '').toLowerCase();
        const isDocument = allowedDocumentMimes.has(mime) && allowedDocumentExts.has(ext);
        const isImage = UploadController.isAcceptedImage(file);
        if (!isDocument && !isImage) {
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


