import {
  DOC_TYPE_PAIRS,
  IMAGE_TYPE_PAIRS,
  VIDEO_TYPE_PAIRS,
  classifyUpload,
} from './upload-types';

describe('classifyUpload', () => {
  const pairs = [
    ...IMAGE_TYPE_PAIRS.map(([ext, mime]) => ({ ext, mime, kind: 'image' as const })),
    ...VIDEO_TYPE_PAIRS.map(([ext, mime]) => ({ ext, mime, kind: 'video' as const })),
    ...DOC_TYPE_PAIRS.map(([ext, mime]) => ({ ext, mime, kind: 'document' as const })),
  ];

  it.each(pairs)('accepts $ext with $mime', ({ ext, mime, kind }) => {
    expect(classifyUpload({ originalname: `file${ext}`, mimetype: mime })).toBe(kind);
  });

  it.each(pairs)('accepts $ext with an empty MIME', ({ ext, kind }) => {
    expect(classifyUpload({ originalname: `file${ext}`, mimetype: '' })).toBe(kind);
  });

  it.each(pairs)('accepts $ext with application/octet-stream', ({ ext, kind }) => {
    expect(classifyUpload({ originalname: `file${ext}`, mimetype: 'application/octet-stream' })).toBe(kind);
  });

  it('accepts an uppercase HEIC photo', () => {
    expect(classifyUpload({ originalname: 'photo.HEIC', mimetype: 'image/heic' })).toBe('image');
  });

  it('accepts 3gp, mkv, and avi videos', () => {
    expect(classifyUpload({ originalname: 'clip.3gp', mimetype: 'video/3gpp' })).toBe('video');
    expect(classifyUpload({ originalname: 'clip.mkv', mimetype: 'video/x-matroska' })).toBe('video');
    expect(classifyUpload({ originalname: 'clip.avi', mimetype: 'video/x-msvideo' })).toBe('video');
  });

  it('rejects executables, svg, and html', () => {
    expect(classifyUpload({ originalname: 'virus.exe', mimetype: 'application/octet-stream' })).toBeNull();
    expect(classifyUpload({ originalname: 'a.svg', mimetype: 'image/svg+xml' })).toBeNull();
    expect(classifyUpload({ originalname: 'a.html', mimetype: 'text/html' })).toBeNull();
  });
});
