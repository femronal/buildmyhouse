import { Injectable } from '@nestjs/common';
import { extname } from 'path';
import sharp from './sharp.util';

const FULL_EDGE = 1200;
const CARD_EDGE = 600;
const FULL_TARGET_BYTES = 150 * 1024;
const CARD_TARGET_BYTES = 80 * 1024;
const MIN_QUALITY = 60;

const COMPRESSIBLE_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/tiff',
  'image/bmp',
  'image/avif',
]);

const COMPRESSIBLE_IMAGE_EXTS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
  '.tif',
  '.tiff',
  '.bmp',
  '.avif',
  '.jfif',
]);

const PRIVATE_FOLDERS = new Set(['files', 'vendor', 'documents']);

export type PreparedPublicPhoto = {
  full: Buffer;
  thumbnail: Buffer;
  contentType: 'image/webp';
  extension: '.webp';
};

@Injectable()
export class ImageCompressionService {
  isPrivateFolder(folder: string): boolean {
    const root = folder.replace(/^\/+|\/+$/g, '').split('/')[0]?.toLowerCase() || '';
    return PRIVATE_FOLDERS.has(root) || folder.toLowerCase().includes('vendor');
  }

  isCompressibleImage(file: { mimetype?: string; originalname?: string; buffer?: Buffer }): boolean {
    const mime = (file.mimetype || '').toLowerCase();
    const ext = extname(file.originalname || '').toLowerCase();
    if (mime === 'image/gif' || ext === '.gif') return false;
    if (mime === 'application/pdf' || ext === '.pdf') return false;
    if (COMPRESSIBLE_IMAGE_MIMES.has(mime) || COMPRESSIBLE_IMAGE_EXTS.has(ext)) return true;
    return this.sniffImage(file.buffer).compressible;
  }

  sniffImage(buffer?: Buffer): { compressible: boolean; kind: string | null } {
    if (!buffer || buffer.length < 12) return { compressible: false, kind: null };
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return { compressible: true, kind: 'jpeg' };
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return { compressible: true, kind: 'png' };
    }
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      return { compressible: true, kind: 'webp' };
    }
    if (buffer.toString('ascii', 0, 3) === 'GIF') return { compressible: false, kind: 'gif' };
    if (buffer.toString('ascii', 0, 4) === '%PDF') return { compressible: false, kind: 'pdf' };
    return { compressible: false, kind: null };
  }

  /**
   * Resize, orient, strip metadata, and write a sharp WebP plus a card thumbnail.
   * Large phone photos are shrunk. They are not rejected.
   */
  async preparePublicPhoto(input: Buffer): Promise<PreparedPublicPhoto> {
    const full = await this.encodeWebp(input, FULL_EDGE, FULL_TARGET_BYTES);
    const thumbnail = await this.encodeWebp(full, CARD_EDGE, CARD_TARGET_BYTES);
    return { full, thumbnail, contentType: 'image/webp', extension: '.webp' };
  }

  private async encodeWebp(input: Buffer, maxEdge: number, targetBytes: number): Promise<Buffer> {
    let edge = maxEdge;
    let quality = 80;
    let best = input;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const next = await sharp(input, { failOn: 'none' })
        .rotate()
        .resize({
          width: edge,
          height: edge,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 4 })
        .toBuffer();
      best = next;
      if (next.length <= targetBytes || quality <= MIN_QUALITY) {
        if (next.length <= targetBytes || edge <= 480) return next;
        edge = Math.max(480, Math.round(edge * 0.85));
        quality = 72;
        continue;
      }
      quality = Math.max(MIN_QUALITY, quality - 8);
    }

    return best;
  }
}
