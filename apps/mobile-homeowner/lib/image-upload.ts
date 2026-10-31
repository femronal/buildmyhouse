import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  IMAGE_TOO_LARGE,
  MAX_IMAGE_BYTES,
  classifyLocalFile,
} from '@/lib/upload-rules';

export const MAX_IMAGE_UPLOAD_BYTES = MAX_IMAGE_BYTES;
export const MAX_IMAGE_UPLOAD_MB = 25;
const LONGEST_SIDE = 1200;

function fileLabel(asset: any) {
  return String(asset?.fileName || asset?.name || '');
}

function jpegName(asset: any) {
  const raw = fileLabel(asset) || `photo-${Date.now()}`;
  const base = raw.replace(/\.[^/.]+$/, '') || `photo-${Date.now()}`;
  return `${base}.jpg`;
}

function isGif(asset: any) {
  const mime = String(asset?.mimeType || asset?.type || '').toLowerCase();
  const name = fileLabel(asset).toLowerCase();
  return mime === 'image/gif' || name.endsWith('.gif');
}

async function byteSize(asset: any): Promise<number | null> {
  const direct = Number(asset?.fileSize ?? asset?.size ?? asset?.file?.size);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const uri = String(asset?.uri || '');
  if (uri.startsWith('data:')) {
    const base64 = uri.split(',')[1] || '';
    return Math.floor((base64.length * 3) / 4);
  }
  if (Platform.OS === 'web' && uri) {
    try {
      const blob = asset.file || (await (await fetch(uri)).blob());
      return blob.size || null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function compressBlobOnWeb(
  blob: Blob,
  maxDimension = LONGEST_SIDE,
  quality = 0.75,
): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  const bitmap = await createImageBitmap(blob).catch(() => null);
  if (!bitmap) return null;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => {
    canvas.toBlob((next) => resolve(next), 'image/jpeg', quality);
  });
}

async function compressOnWeb(asset: any) {
  const source: Blob | null = asset.file || (asset.uri ? await (await fetch(asset.uri)).blob() : null);
  if (!source) return asset;
  const compressed = await compressBlobOnWeb(source).catch(() => null);
  if (!compressed) return asset;
  const name = jpegName(asset);
  const file = new File([compressed], name, { type: 'image/jpeg' });
  return {
    ...asset,
    uri: URL.createObjectURL(file),
    file,
    mimeType: 'image/jpeg',
    type: 'image/jpeg',
    fileName: name,
    name,
    fileSize: file.size,
    size: file.size,
  };
}

async function compressOnDevice(asset: any) {
  const width = Number(asset?.width || 0);
  const height = Number(asset?.height || 0);
  const actions: ImageManipulator.Action[] = [];
  if (width > LONGEST_SIDE || height > LONGEST_SIDE) {
    if (width >= height) actions.push({ resize: { width: LONGEST_SIDE } });
    else actions.push({ resize: { height: LONGEST_SIDE } });
  }
  const result = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: 0.75,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  const name = jpegName(asset);
  return {
    ...asset,
    uri: result.uri,
    width: result.width,
    height: result.height,
    mimeType: 'image/jpeg',
    type: 'image/jpeg',
    fileName: name,
    name,
    fileSize: undefined,
    size: undefined,
  };
}

export async function prepareImageForUpload(asset: any) {
  const kind = classifyLocalFile(fileLabel(asset), asset?.mimeType || asset?.type);
  if (kind === 'video' || kind === 'document') return asset;
  const originalSize = await byteSize(asset);
  if (originalSize !== null && originalSize > MAX_IMAGE_BYTES) {
    throw new Error(IMAGE_TOO_LARGE);
  }
  if (isGif(asset)) return asset;
  let next = asset;
  try {
    next = Platform.OS === 'web' ? await compressOnWeb(asset) : await compressOnDevice(asset);
  } catch {
    next = asset;
  }
  const compressedSize = await byteSize(next);
  if (compressedSize !== null && compressedSize > MAX_IMAGE_BYTES) {
    throw new Error(IMAGE_TOO_LARGE);
  }
  return next;
}
