import { extname } from 'path';

export const IMAGE_TYPE_PAIRS = [
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.jpe', 'image/jpeg'],
  ['.jfif', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.heic', 'image/heic'],
  ['.heif', 'image/heif'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
  ['.bmp', 'image/bmp'],
  ['.tif', 'image/tiff'],
  ['.tiff', 'image/tiff'],
  ['.avif', 'image/avif'],
  ['.dng', 'image/x-adobe-dng'],
  ['.jxl', 'image/jxl'],
] as const;

export const VIDEO_TYPE_PAIRS = [
  ['.mp4', 'video/mp4'],
  ['.m4v', 'video/x-m4v'],
  ['.mov', 'video/quicktime'],
  ['.3gp', 'video/3gpp'],
  ['.3g2', 'video/3gpp2'],
  ['.webm', 'video/webm'],
  ['.mkv', 'video/x-matroska'],
  ['.avi', 'video/x-msvideo'],
] as const;

export const DOC_TYPE_PAIRS = [
  ['.pdf', 'application/pdf'],
  ['.doc', 'application/msword'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
] as const;

export const IMAGE_EXTS = new Set<string>(IMAGE_TYPE_PAIRS.map(([ext]) => ext));
export const VIDEO_EXTS = new Set<string>(VIDEO_TYPE_PAIRS.map(([ext]) => ext));
export const DOC_EXTS = new Set<string>(DOC_TYPE_PAIRS.map(([ext]) => ext));

export const IMAGE_MIMES = new Set<string>([
  ...IMAGE_TYPE_PAIRS.map(([, mime]) => mime),
  'image/jpg',
  'image/pjpeg',
  'image/heic-sequence',
  'image/heif-sequence',
  'image/x-ms-bmp',
]);

export const VIDEO_MIMES = new Set<string>([
  ...VIDEO_TYPE_PAIRS.map(([, mime]) => mime),
  'video/matroska',
  'video/avi',
  'video/msvideo',
]);

export const DOC_MIMES = new Set<string>(DOC_TYPE_PAIRS.map(([, mime]) => mime));

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_DOC_BYTES = 50 * 1024 * 1024;

export const IMAGE_TYPE_MESSAGE =
  'This file type is not supported. Please upload a JPG, PNG, HEIC, WebP, GIF, BMP or TIFF image.';
export const FILE_TYPE_MESSAGE =
  'This file type is not supported. Please upload a photo (JPG, PNG, HEIC, WebP, GIF, BMP, TIFF), a video (MP4, MOV, 3GP, WebM, MKV, AVI) or a PDF/Word document.';
export const FILE_TOO_LARGE_MESSAGE =
  'File too large. Images can be up to 25MB and videos up to 100MB.';

const EXT_TO_MIME = new Map<string, string>([
  ...IMAGE_TYPE_PAIRS,
  ...VIDEO_TYPE_PAIRS,
  ...DOC_TYPE_PAIRS,
]);

export type UploadKind = 'image' | 'video' | 'document';

function extensionOf(name?: string) {
  return extname(name || '').toLowerCase();
}

export function mimeFromExtension(name?: string): string | null {
  return EXT_TO_MIME.get(extensionOf(name)) || null;
}

export function classifyUpload(file: { originalname?: string; mimetype?: string }): UploadKind | null {
  const mime = String(file.mimetype || '').trim().toLowerCase();
  const ext = extensionOf(file.originalname);
  if (IMAGE_MIMES.has(mime)) return 'image';
  if (VIDEO_MIMES.has(mime)) return 'video';
  if (DOC_MIMES.has(mime)) return 'document';
  const generic = !mime || mime === 'application/octet-stream' || mime === 'binary/octet-stream';
  if (generic) {
    if (IMAGE_EXTS.has(ext)) return 'image';
    if (VIDEO_EXTS.has(ext)) return 'video';
    if (DOC_EXTS.has(ext)) return 'document';
    return null;
  }
  if (mime.startsWith('image/') && IMAGE_EXTS.has(ext)) return 'image';
  if (mime.startsWith('video/') && VIDEO_EXTS.has(ext)) return 'video';
  return null;
}

export function storedContentType(file: { originalname?: string; mimetype?: string }): string {
  const mime = String(file.mimetype || '').trim().toLowerCase();
  const generic = !mime || mime === 'application/octet-stream' || mime === 'binary/octet-stream';
  if (!generic) return mime;
  return mimeFromExtension(file.originalname) || mime || 'application/octet-stream';
}
