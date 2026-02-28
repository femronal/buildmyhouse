import { Platform } from 'react-native';
import { api } from '@/lib/api';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api' 
  : 'https://api.buildmyhouse.com/api';

type UploadFileOptions = {
  fileName?: string;
  mimeType?: string;
};

function inferExtensionFromMime(mimeType?: string): string {
  if (!mimeType) return '';
  const normalized = mimeType.toLowerCase();
  if (normalized.includes('pdf')) return 'pdf';
  if (normalized.includes('msword')) return 'doc';
  if (normalized.includes('wordprocessingml.document')) return 'docx';
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
  if (normalized.includes('webp')) return 'webp';
  if (normalized.includes('gif')) return 'gif';
  if (normalized.includes('mp4')) return 'mp4';
  if (normalized.includes('quicktime')) return 'mov';
  if (normalized.includes('mpeg')) return 'mp3';
  return '';
}

/**
 * Upload a single file to the backend
 * Returns the uploaded file URL
 */
export async function uploadFile(
  uri: string,
  type: 'image' | 'document' | 'media' = 'image',
  options: UploadFileOptions = {},
): Promise<string> {
  try {
    const formData = new FormData();
    
    const isDataUrl = typeof uri === 'string' && uri.startsWith('data:');

    // Extract filename from URI (avoid using data URL content as filename)
    let filename =
      options.fileName ||
      (isDataUrl ? `file-${Date.now()}` : uri.split('/').pop()) ||
      `file-${Date.now()}.jpg`;
    filename = filename.split('?')[0]; // Remove query parameters
    filename = filename.replace(/[^a-zA-Z0-9._ -]/g, '_');
    
    // Determine MIME type from extension
    const match = /\.(\w+)$/.exec(filename);
    let mimeType = options.mimeType || 'image/jpeg'; // default
    
    if (!options.mimeType && match) {
      const ext = match[1].toLowerCase();
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'pdf') mimeType = 'application/pdf';
      else if (ext === 'doc') mimeType = 'application/msword';
      else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (ext === 'mp4') mimeType = 'video/mp4';
      else if (ext === 'mov') mimeType = 'video/quicktime';
      else if (ext === 'mp3') mimeType = 'audio/mpeg';
    }

    if (!/\.[A-Za-z0-9]+$/.test(filename)) {
      const inferredExt = inferExtensionFromMime(mimeType);
      if (inferredExt) {
        filename = `${filename}.${inferredExt}`;
      }
    }
    
    // For web platform, fetch and convert to Blob/File
    if (Platform.OS === 'web') {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: mimeType });
        
        formData.append('file', file);
      } catch (error) {
        console.error('❌ [fileUpload] Failed to process file for web:', error);
        throw error;
      }
    } else {
      // Native platform - use React Native FormData format
      formData.append('file', {
        uri,
        type: mimeType,
        name: filename,
      } as any);
    }
    
    // Get auth token for headers
    const { getAuthToken } = await import('@/lib/auth');
    const token = await getAuthToken();
    
    const headers: any = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    
    // Make upload request to a generic upload endpoint
    const uploadUrl = type === 'image' 
      ? '/upload/image' // Generic image upload endpoint
      : '/upload/file'; // Generic file upload endpoint
    
    const response = await fetch(`${API_BASE_URL}${uploadUrl}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        const text = await response.text();
        errorData = { message: text || 'Upload failed' };
      }
      console.error('❌ [fileUpload] Upload error:', errorData);
      const apiMessage = String(errorData?.message || '').toLowerCase();
      if (
        response.status === 413 ||
        apiMessage.includes('file too large') ||
        apiMessage.includes('payload too large')
      ) {
        throw new Error('File too large. Please choose a smaller file and try again.');
      }
      throw new Error(errorData.message || `Failed to upload file: HTTP ${response.status}`);
    }
    
    const result = await response.json();
    let fileUrl = result.url || result.path || `/uploads/${type}s/${result.filename}`;
    
    // If the URL doesn't start with http, it's a relative path
    // For local development, prepend the backend URL
    if (!fileUrl.startsWith('http')) {
      const backendUrl = __DEV__ 
        ? 'http://localhost:3001' 
        : 'https://api.buildmyhouse.com';
      fileUrl = `${backendUrl}${fileUrl}`;
    }
    return fileUrl;
  } catch (error: any) {
    console.error('❌ [fileUpload] Error uploading file:', error);
    throw error;
  }
}

/**
 * Upload multiple files and return their URLs
 */
export async function uploadFiles(uris: string[], type: 'image' | 'document' | 'media' = 'image'): Promise<string[]> {
  const uploadPromises = uris.map(uri => uploadFile(uri, type));
  return Promise.all(uploadPromises);
}

