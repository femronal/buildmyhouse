export const IMAGE_ACCEPT = 'image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff';
export const VIDEO_ACCEPT = 'video/*,.mp4,.mov,.3gp,.webm,.mkv,.avi';
export const MEDIA_ACCEPT = `${IMAGE_ACCEPT},${VIDEO_ACCEPT},.pdf,application/pdf`;

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_DOC_BYTES = 50 * 1024 * 1024;

export const TYPE_MESSAGE =
  'This file type is not supported. Please upload a JPG, PNG, HEIC, WebP, GIF, BMP or TIFF photo, or an MP4, MOV, 3GP, WebM, MKV or AVI video.';
export const IMAGE_TOO_LARGE =
  'This photo is too large (max 25MB). Please choose a smaller photo.';
export const VIDEO_TOO_LARGE =
  'This video is too large (max 100MB). Please trim it or record a shorter clip.';
export const NETWORK_MESSAGE = 'Upload failed. Check your connection and try again.';

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.jpe', '.jfif', '.png', '.heic', '.heif', '.webp', '.gif', '.bmp', '.tif', '.tiff', '.avif', '.dng', '.jxl']);
const VIDEO_EXTS = new Set(['.mp4', '.m4v', '.mov', '.3gp', '.3g2', '.webm', '.mkv', '.avi']);
const DOC_EXTS = new Set(['.pdf', '.doc', '.docx']);

const IMAGE_MIMES = new Set([
  'image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/heic', 'image/heif',
  'image/heic-sequence', 'image/heif-sequence', 'image/webp', 'image/gif', 'image/bmp',
  'image/x-ms-bmp', 'image/tiff', 'image/avif', 'image/x-adobe-dng', 'image/jxl',
]);
const VIDEO_MIMES = new Set([
  'video/mp4', 'video/x-m4v', 'video/quicktime', 'video/3gpp', 'video/3gpp2', 'video/webm',
  'video/x-matroska', 'video/matroska', 'video/x-msvideo', 'video/avi', 'video/msvideo',
]);
const DOC_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function extensionOf(name?: string) {
  const match = /\.([a-z0-9]+)$/i.exec(String(name || '').split('?')[0]);
  return match ? `.${match[1].toLowerCase()}` : '';
}

export function classifyLocalFile(name?: string, mimeType?: string): 'image' | 'video' | 'document' | null {
  const mime = String(mimeType || '').trim().toLowerCase();
  const ext = extensionOf(name);
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

const KNOWN_MESSAGES = new Set([TYPE_MESSAGE, IMAGE_TOO_LARGE, VIDEO_TOO_LARGE, NETWORK_MESSAGE]);

export function friendlyUploadError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || '');
  if (KNOWN_MESSAGES.has(raw)) return raw;
  const message = raw.toLowerCase();
  if (raw.includes('File too large. Images can be up to 25MB and videos up to 100MB.')) {
    return 'File too large. Images can be up to 25MB and videos up to 100MB.';
  }
  if (message.includes('413') || message.includes('too large') || message.includes('payload too large')) {
    if (message.includes('video')) return VIDEO_TOO_LARGE;
    if (message.includes('photo') || message.includes('image')) return IMAGE_TOO_LARGE;
    return 'File too large. Images can be up to 25MB and videos up to 100MB.';
  }
  if (message.includes('not supported')) return TYPE_MESSAGE;
  if (message.includes('network') || message.includes('failed to fetch') || message.includes('timeout')) {
    return NETWORK_MESSAGE;
  }
  const cleaned = raw.replace(/^upload failed:\s*/i, '').trim();
  return cleaned ? `Upload failed: ${cleaned}` : 'Upload failed. Please try again.';
}

export function assertUploadAllowed(file: File, endpoint: string) {
  const kind = classifyLocalFile(file.name, file.type);
  const allowsVideo = endpoint !== '/upload/image';
  if (!kind || (kind !== 'image' && !allowsVideo)) {
    throw new Error(TYPE_MESSAGE);
  }
  if (kind === 'image' && file.size > MAX_IMAGE_BYTES) throw new Error(IMAGE_TOO_LARGE);
  if (kind === 'video' && file.size > MAX_VIDEO_BYTES) throw new Error(VIDEO_TOO_LARGE);
  if (kind === 'document' && file.size > MAX_DOC_BYTES) {
    throw new Error('This document is too large (max 50MB).');
  }
}
