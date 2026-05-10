import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'path';
import sharp from 'sharp';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1920;
const MIN_QUALITY = 40;
const START_QUALITY = 82;
const QUALITY_STEP = 7;
const MAX_DIMENSION_ATTEMPTS = 4;

const COMPRESSIBLE_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const COMPRESSIBLE_IMAGE_EXTS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
]);

@Injectable()
export class ImageCompressionService {
  async compressIfNeeded(file: Express.Multer.File): Promise<{
    buffer: Buffer;
    contentType: string;
    size: number;
    wasCompressed: boolean;
  }> {
    if (!this.isCompressibleImage(file)) {
      if (file.size > MAX_IMAGE_BYTES) {
        throw new BadRequestException(
          'Uploaded file must be 2MB or less. Please reduce file size and try again.',
        );
      }

      return {
        buffer: file.buffer,
        contentType: file.mimetype || 'application/octet-stream',
        size: file.size,
        wasCompressed: false,
      };
    }

    if (file.size <= MAX_IMAGE_BYTES) {
      return {
        buffer: file.buffer,
        contentType: file.mimetype || 'image/jpeg',
        size: file.size,
        wasCompressed: false,
      };
    }

    const compressedBuffer = await this.compressToMax2Mb(file.buffer);

    if (compressedBuffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException(
        'Image is too large to optimize below 2MB. Please upload a smaller image.',
      );
    }

    return {
      buffer: compressedBuffer,
      contentType: 'image/jpeg',
      size: compressedBuffer.length,
      wasCompressed: true,
    };
  }

  private isCompressibleImage(file: Express.Multer.File): boolean {
    const mime = (file.mimetype || '').toLowerCase();
    const ext = extname(file.originalname || '').toLowerCase();

    if (mime === 'image/gif' || ext === '.gif') {
      return false;
    }

    return COMPRESSIBLE_IMAGE_MIMES.has(mime) || COMPRESSIBLE_IMAGE_EXTS.has(ext);
  }

  private async compressToMax2Mb(inputBuffer: Buffer): Promise<Buffer> {
    let currentMaxDimension = MAX_IMAGE_DIMENSION;
    let best = inputBuffer;

    for (let dimensionAttempt = 0; dimensionAttempt < MAX_DIMENSION_ATTEMPTS; dimensionAttempt += 1) {
      for (let quality = START_QUALITY; quality >= MIN_QUALITY; quality -= QUALITY_STEP) {
        const next = await sharp(inputBuffer, { failOn: 'none' })
          .rotate()
          .resize({
            width: currentMaxDimension,
            height: currentMaxDimension,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .flatten({ background: { r: 255, g: 255, b: 255 } })
          .jpeg({
            quality,
            mozjpeg: true,
            chromaSubsampling: '4:2:0',
          })
          .toBuffer();

        best = next;
        if (next.length <= MAX_IMAGE_BYTES) {
          return next;
        }
      }

      currentMaxDimension = Math.round(currentMaxDimension * 0.82);
    }

    return best;
  }
}
