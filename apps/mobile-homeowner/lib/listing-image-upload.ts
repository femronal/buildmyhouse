import { Platform } from 'react-native';
import { api } from '@/lib/api';
import { ensureImageWithinUploadLimit } from '@/lib/image-upload';

type PickedImage = {
  uri: string;
  fileName?: string | null;
  name?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  size?: number | null;
};

export async function uploadListingImage(asset: PickedImage): Promise<string> {
  const prepared = await ensureImageWithinUploadLimit(asset);
  if (prepared.exceedsLimit) {
    throw new Error('Image too large. Please choose an image below 50MB.');
  }
  const file = prepared.asset;
  const name = file.fileName || file.name || asset.fileName || asset.name || `listing-${Date.now()}.jpg`;
  const type = file.mimeType || asset.mimeType || 'image/jpeg';
  const formData = new FormData();
  if (Platform.OS === 'web') {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    formData.append('file', blob, name);
  } else {
    formData.append('file', {
      uri: file.uri,
      name,
      type,
    } as any);
  }
  const uploadRes = await api.post('/upload/image', formData);
  const url = String(uploadRes?.url || '').trim();
  if (!url) throw new Error('Upload succeeded but no image URL was returned.');
  return url;
}
