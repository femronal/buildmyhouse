import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as provenance from '../stages/stage-media-provenance';
import { UploadController } from './upload.controller';

const fixturePath = join(__dirname, '../../test/fixtures/sample.heic');

function controllerWith(uploadBuffer: jest.Mock) {
  return new UploadController(
    { uploadBuffer } as any,
    { get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined) } as any,
  );
}

describe('upload fingerprint', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('20. uploadImage hashes the original fixture bytes before uploadBuffer', async () => {
    const bytes = readFileSync(fixturePath);
    const expected = createHash('sha256').update(bytes).digest('hex');
    const order: string[] = [];
    const realHash = provenance.sha256OfBuffer;
    jest.spyOn(provenance, 'sha256OfBuffer').mockImplementation((buffer: Buffer) => {
      order.push('hash');
      return realHash(buffer);
    });
    const uploadBuffer = jest.fn(async (input: { buffer: Buffer }) => {
      order.push('upload');
      return {
        url: 'https://cdn.example/sample.jpg',
        thumbnailUrl: null,
        key: 'images/sample.jpg',
        filename: 'sample.jpg',
        buffer: input.buffer,
      };
    });
    const controller = controllerWith(uploadBuffer);
    const result = await controller.uploadImage(
      {
        buffer: bytes,
        size: bytes.length,
        originalname: 'sample.heic',
        mimetype: 'image/heic',
      } as any,
      { user: { sub: 'user-1' } },
      undefined,
    );
    expect(result.sha256).toBe(expected);
    expect(result.url).toBe('https://cdn.example/sample.jpg');
    expect(uploadBuffer).toHaveBeenCalled();
    expect(order.indexOf('hash')).toBeGreaterThanOrEqual(0);
    expect(order.indexOf('hash')).toBeLessThan(order.indexOf('upload'));
    expect(uploadBuffer.mock.calls[0][0].buffer).toEqual(bytes);
  });

  it('21. an invalid originalSha256 is stored as null and the upload still succeeds', async () => {
    const bytes = readFileSync(fixturePath);
    const uploadBuffer = jest.fn(async () => ({
      url: 'https://cdn.example/sample.jpg',
      thumbnailUrl: null,
      key: 'images/sample.jpg',
      filename: 'sample.jpg',
    }));
    const controller = controllerWith(uploadBuffer);
    const result = await controller.uploadImage(
      {
        buffer: bytes,
        size: bytes.length,
        originalname: 'sample.heic',
        mimetype: 'image/heic',
      } as any,
      { user: { sub: 'user-1' } },
      'not-a-hash',
    );
    expect(result.originalSha256).toBeNull();
    expect(result.sha256).toHaveLength(64);
    expect(result.url).toBe('https://cdn.example/sample.jpg');
    expect(result.fingerprintToken).toEqual(expect.any(String));
  });
});
