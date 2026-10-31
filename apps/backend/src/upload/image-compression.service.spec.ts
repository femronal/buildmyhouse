import sharp from './sharp.util';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ImageCompressionService } from './image-compression.service';

describe('public photo compression', () => {
  const service = new ImageCompressionService();

  it('turns a photo into a webp full image and a smaller card thumbnail', async () => {
    const source = await sharp({
      create: { width: 1800, height: 1200, channels: 3, background: { r: 40, g: 120, b: 70 } },
    })
      .jpeg()
      .toBuffer();

    const prepared = await service.preparePublicPhoto(source);
    const fullMeta = await sharp(prepared.full).metadata();
    const cardMeta = await sharp(prepared.thumbnail).metadata();

    expect(prepared.contentType).toBe('image/webp');
    expect(fullMeta.format).toBe('webp');
    expect(Math.max(fullMeta.width || 0, fullMeta.height || 0)).toBeLessThanOrEqual(1200);
    expect(Math.max(cardMeta.width || 0, cardMeta.height || 0)).toBeLessThanOrEqual(600);
    expect(prepared.thumbnail.length).toBeLessThanOrEqual(prepared.full.length);
    expect(prepared.full.length).toBeLessThan(150 * 1024);
  });

  it('skips private folders and pdf bytes', () => {
    expect(service.isPrivateFolder('files')).toBe(true);
    expect(service.isPrivateFolder('vendor/docs')).toBe(true);
    expect(service.isPrivateFolder('images')).toBe(false);
    expect(service.sniffImage(Buffer.from('%PDF-1.4 sample'))).toEqual({ compressible: false, kind: 'pdf' });
  });

  it('recognises HEIC, BMP, and TIFF headers', () => {
    const heic = Buffer.alloc(16);
    heic.write('ftypheic', 4, 'ascii');
    expect(service.sniffImage(heic)).toEqual({ compressible: true, kind: 'heic' });
    const bmp = Buffer.from('BM');
    const paddedBmp = Buffer.alloc(12);
    bmp.copy(paddedBmp);
    expect(service.sniffImage(paddedBmp).kind).toBe('bmp');
    const tiff = Buffer.alloc(12);
    tiff[0] = 0x49;
    tiff[1] = 0x49;
    tiff[2] = 0x2a;
    tiff[3] = 0x00;
    expect(service.sniffImage(tiff).kind).toBe('tiff');
  });

  it('converts a real HEIC photo to JPEG', async () => {
    const fixture = join(__dirname, '../../test/fixtures/sample.heic');
    if (!existsSync(fixture)) {
      // TODO: create apps/backend/test/fixtures/sample.heic with sips when this machine can encode HEIC.
      return;
    }
    const buffer = readFileSync(fixture);
    const result = await service.convertHeicToJpeg({
      buffer,
      contentType: 'image/heic',
      originalName: 'sample.heic',
    });
    expect(result.converted).toBe(true);
    expect(result.contentType).toBe('image/jpeg');
    expect(result.originalName).toBe('sample.jpg');
    expect(result.buffer[0]).toBe(0xff);
    expect(result.buffer[1]).toBe(0xd8);
    const photo = await service.preparePublicPhoto(result.buffer);
    expect(photo.extension).toBe('.webp');
    expect(photo.contentType).toBe('image/webp');
  });
});
