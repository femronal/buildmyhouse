import sharp from './sharp.util';
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
});
