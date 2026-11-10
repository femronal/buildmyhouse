import { Platform } from 'react-native';

export type CaptureMethod = 'camera' | 'gallery';

type CaptureLocation = {
  lat: number;
  lng: number;
  accuracyMeters: number;
};

export function startLocationRequest(timeoutMs = 10000): Promise<CaptureLocation | null> {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: CaptureLocation | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timer);
          const accuracy = position.coords.accuracy;
          finish({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracyMeters: typeof accuracy === 'number' && Number.isFinite(accuracy) ? accuracy : 0,
          });
        },
        () => {
          clearTimeout(timer);
          finish(null);
        },
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
      );
    } catch {
      clearTimeout(timer);
      finish(null);
    }
  });
}

export async function sha256OfFile(file: File | Blob): Promise<string | null> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle || typeof file?.arrayBuffer !== 'function') return null;
    const digest = await subtle.digest('SHA-256', await file.arrayBuffer());
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
}
