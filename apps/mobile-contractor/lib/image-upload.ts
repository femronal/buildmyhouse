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
    const exceedsLimit = webSize !== null && webSize > MAX_IMAGE_UPLOAD_BYTES;
    return { asset, wasCompressed: false, exceedsLimit };
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
