import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

const MAX_IMAGE_UPLOAD_BYTES = 50 * 1024 * 1024;
const AUTO_COMPRESS_TARGET_BYTES = 45 * 1024 * 1024;
const AUTO_COMPRESS_QUALITIES = [0.82, 0.7, 0.58, 0.45, 0.35];

type EnsureImageResult = {
  asset: any;
  wasCompressed: boolean;
  exceedsLimit: boolean;
};

function replaceExtensionWithJpg(fileName?: string) {
  if (!fileName) return `image-${Date.now()}.jpg`;
  return fileName.replace(/\.[^./]+$/, '.jpg');
}

function getBlobFromUriOnWeb(uri: string): Promise<Blob> {
  return fetch(uri).then((res) => res.blob());
}

async function compressBlobOnWeb(
  blob: Blob,
  quality: number,
  maxDimension: number,
): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;

  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image decode failed'));
      img.src = objectUrl;
    });

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) return null;

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(width * scale));
    canvas.height = Math.max(1, Math.floor(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((compressed) => resolve(compressed), 'image/jpeg', quality);
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function getUriSizeBytes(uri: string): Promise<number | null> {
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return typeof blob.size === 'number' && blob.size > 0 ? blob.size : null;
  } catch {
    return null;
  }
}

function getAssetSizeBytes(asset: any): number | null {
  const raw = asset?.fileSize ?? asset?.size;
  if (typeof raw !== 'number' || Number.isNaN(raw) || raw <= 0) return null;
  return raw;
}

export async function ensureImageWithinUploadLimit(asset: any): Promise<EnsureImageResult> {
  const knownSize = getAssetSizeBytes(asset);
  if (knownSize !== null && knownSize <= MAX_IMAGE_UPLOAD_BYTES) {
    return { asset, wasCompressed: false, exceedsLimit: false };
  }

  if (Platform.OS === 'web') {
    const webSize = knownSize ?? (asset?.uri ? await getUriSizeBytes(asset.uri) : null);
    if (webSize !== null && webSize <= MAX_IMAGE_UPLOAD_BYTES) {
      return {
        asset: { ...asset, size: webSize, fileSize: webSize },
        wasCompressed: false,
        exceedsLimit: false,
      };
    }

    if (!asset?.uri) return { asset, wasCompressed: false, exceedsLimit: true };
    try {
      const sourceBlob = await getBlobFromUriOnWeb(asset.uri);
      if (sourceBlob.size <= MAX_IMAGE_UPLOAD_BYTES) {
        return {
          asset: { ...asset, size: sourceBlob.size, fileSize: sourceBlob.size },
          wasCompressed: false,
          exceedsLimit: false,
        };
      }

      const dimensions = [4096, 3072, 2560, 2048, 1600, 1280];
      for (const dimension of dimensions) {
        for (const quality of AUTO_COMPRESS_QUALITIES) {
          const compressedBlob = await compressBlobOnWeb(sourceBlob, quality, dimension);
          if (!compressedBlob) continue;
          if (compressedBlob.size > MAX_IMAGE_UPLOAD_BYTES) continue;

          const compressedUrl = URL.createObjectURL(compressedBlob);
          return {
            asset: {
              ...asset,
              uri: compressedUrl,
              mimeType: 'image/jpeg',
              fileName: replaceExtensionWithJpg(asset?.fileName || asset?.name),
              size: compressedBlob.size,
              fileSize: compressedBlob.size,
            },
            wasCompressed: true,
            exceedsLimit: false,
          };
        }
      }
    } catch {
      // no-op: fall through to exceedsLimit below
    }

    return { asset, wasCompressed: false, exceedsLimit: true };
  }

  const initialSize = knownSize ?? (asset?.uri ? await getUriSizeBytes(asset.uri) : null);
  if (initialSize !== null && initialSize <= MAX_IMAGE_UPLOAD_BYTES) {
    return {
      asset: { ...asset, size: initialSize, fileSize: initialSize },
      wasCompressed: false,
      exceedsLimit: false,
    };
  }

  let workingUri = asset?.uri;
  if (!workingUri) return { asset, wasCompressed: false, exceedsLimit: true };

  let width = Number(asset?.width) || 0;
  let height = Number(asset?.height) || 0;

  for (let i = 0; i < AUTO_COMPRESS_QUALITIES.length; i += 1) {
    const quality = AUTO_COMPRESS_QUALITIES[i];
    const shouldResize = i >= 2 && width > 0 && height > 0;
    const scale = shouldResize ? (i === 2 ? 0.9 : i === 3 ? 0.8 : 0.7) : 1;

    const actions: ImageManipulator.Action[] = [];
    if (shouldResize) {
      actions.push({
        resize: {
          width: Math.max(1280, Math.floor(width * scale)),
          height: Math.max(1280, Math.floor(height * scale)),
        },
      });
    }

    const manipulated = await ImageManipulator.manipulateAsync(workingUri, actions, {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    workingUri = manipulated.uri;
    width = manipulated.width || width;
    height = manipulated.height || height;

    const compressedSize = await getUriSizeBytes(manipulated.uri);
    if (compressedSize !== null && compressedSize <= AUTO_COMPRESS_TARGET_BYTES) {
      return {
        asset: {
          ...asset,
          uri: manipulated.uri,
          width: manipulated.width || asset?.width,
          height: manipulated.height || asset?.height,
          mimeType: 'image/jpeg',
          fileName: replaceExtensionWithJpg(asset?.fileName || asset?.name),
          size: compressedSize,
          fileSize: compressedSize,
        },
        wasCompressed: true,
        exceedsLimit: false,
      };
    }
  }

  const finalSize = await getUriSizeBytes(workingUri);
  if (finalSize !== null && finalSize <= MAX_IMAGE_UPLOAD_BYTES) {
    return {
      asset: {
        ...asset,
        uri: workingUri,
        mimeType: 'image/jpeg',
        fileName: replaceExtensionWithJpg(asset?.fileName || asset?.name),
        size: finalSize,
        fileSize: finalSize,
      },
      wasCompressed: true,
      exceedsLimit: false,
    };
  }

  return { asset, wasCompressed: false, exceedsLimit: true };
}
