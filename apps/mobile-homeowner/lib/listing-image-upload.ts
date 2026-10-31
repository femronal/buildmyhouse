import { Platform } from 'react-native';
import { api } from '@/lib/api';
import { prepareImageForUpload } from '@/lib/image-upload';
import { friendlyUploadError, mimeFromExtension } from '@/lib/upload-rules';

type PickedImage = {
  uri: string;
  fileName?: string | null;
  name?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  size?: number | null;
};

export async function uploadListingImage(asset: PickedImage): Promise<string> {
  const file = await prepareImageForUpload(asset);
  const name = file.fileName || file.name || asset.fileName || asset.name || `listing-${Date.now()}.jpg`;
  const type = mimeFromExtension(name) || file.mimeType || asset.mimeType || 'image/jpeg';
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
  try {
    const uploadRes = await api.post('/upload/image', formData);
    const url = String(uploadRes?.url || '').trim();
    if (!url) throw new Error('Upload succeeded but no image URL was returned.');
    return url;
  } catch (error) {
    throw new Error(friendlyUploadError(error));
  }
}
