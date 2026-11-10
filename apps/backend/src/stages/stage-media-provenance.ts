import { createHash, createHmac, timingSafeEqual } from 'crypto';

export const ON_SITE_RADIUS_METERS = 300;
export const MAX_USEFUL_ACCURACY_METERS = 1000;
export const MAX_CAPTURE_CLOCK_SKEW_MS = 5 * 60 * 1000;
export const LABEL_TIME_ZONE = 'Africa/Lagos';
export const FINGERPRINT_TOKEN_PREFIX = 'stage-media-fingerprint:v1';

export type MediaViewer = 'homeowner' | 'gc' | 'admin';
export type ProvenanceTone = 'ok' | 'warn' | 'neutral';

export type CaptureLocation = {
  lat: number | null;
  lng: number | null;
  accuracyMeters: number | null;
};

export type ProvenanceLabel = {
  label: string;
  duplicateLabel: string | null;
  tone: ProvenanceTone;
};

const EARTH_RADIUS_METERS = 6371000;

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function distanceFromSite(
  capture: { lat?: number | null; lng?: number | null } | null | undefined,
  project: { latitude?: number | null; longitude?: number | null } | null | undefined,
): number | null {
  const lat1 = capture?.lat;
  const lng1 = capture?.lng;
  const lat2 = project?.latitude;
  const lng2 = project?.longitude;
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  if (![lat1, lng1, lat2, lng2].every((value) => typeof value === 'number' && Number.isFinite(value))) return null;
  return Math.round(haversineMeters(lat1, lng1, lat2, lng2));
}

export function normalizeCaptureLocation(input?: {
  lat?: number | null;
  lng?: number | null;
  accuracyMeters?: number | null;
} | null): CaptureLocation {
  if (input == null) return { lat: null, lng: null, accuracyMeters: null };
  const lat = typeof input.lat === 'number' ? input.lat : Number(input.lat);
  const lng = typeof input.lng === 'number' ? input.lng : Number(input.lng);
  const latOk = Number.isFinite(lat) && lat >= -90 && lat <= 90;
  const lngOk = Number.isFinite(lng) && lng >= -180 && lng <= 180;
  if (!latOk || !lngOk) return { lat: null, lng: null, accuracyMeters: null };
  const accuracy = typeof input.accuracyMeters === 'number' ? input.accuracyMeters : Number(input.accuracyMeters);
  return {
    lat,
    lng,
    accuracyMeters: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null,
  };
}

export function normalizeCapturedAt(value: unknown, serverNow: Date): Date | null {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  if (date.getTime() > serverNow.getTime() + MAX_CAPTURE_CLOCK_SKEW_MS) return null;
  return date;
}

export function resolveSource(input: { role?: string | null; captureMethod?: string | null }): 'camera' | 'gallery' | 'admin_upload' | 'whatsapp' | 'unknown' {
  if (input.role === 'admin') return 'admin_upload';
  if (input.captureMethod === 'camera') return 'camera';
  if (input.captureMethod === 'gallery') return 'gallery';
  return 'unknown';
}

export function isSha256Hex(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
}

export function sha256OfBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

type FingerprintPayload = {
  userId: string;
  url: string;
  sha256: string;
  originalSha256?: string | null;
};

function fingerprintMessage(payload: FingerprintPayload): string {
  return `${FINGERPRINT_TOKEN_PREFIX}|${payload.userId}|${payload.url}|${payload.sha256}|${payload.originalSha256 || ''}`;
}

export function signFingerprint(secret: string, payload: FingerprintPayload): string {
  return createHmac('sha256', secret).update(fingerprintMessage(payload)).digest('hex');
}

export function verifyFingerprint(secret: string, payload: FingerprintPayload, token: unknown): boolean {
  try {
    if (!secret || typeof token !== 'string' || token.length === 0) return false;
    const expected = signFingerprint(secret, payload);
    const left = Buffer.from(expected);
    const right = Buffer.from(token);
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function formatLabelTime(date: Date): string {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: LABEL_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h12',
  }).formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '';
  const day = read('day');
  const month = read('month').replace(/\.$/, '');
  const minute = read('minute');
  let hour = Number(read('hour'));
  let period = read('dayPeriod').replace(/\./g, '').replace(/\s+/g, '').toLowerCase();
  if (period !== 'am' && period !== 'pm') {
    const hour24 = Number(new Intl.DateTimeFormat('en-GB', {
      timeZone: LABEL_TIME_ZONE,
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(value));
    period = hour24 >= 12 ? 'pm' : 'am';
    hour = hour24 % 12 || 12;
  }
  if (!Number.isFinite(hour) || hour === 0) hour = 12;
  return `${day} ${month}, ${hour}:${minute}${period}`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function duplicateText(media: any, viewer: MediaViewer): string | null {
  const duplicate = media?.duplicateOf;
  if (!duplicate) return null;
  const duplicateStageId = duplicate.stageId || null;
  const stageName = duplicate.stageName || duplicate.stage?.name || '';
  const duplicateProjectId = duplicate.projectId || duplicate.stage?.projectId || null;
  const projectName = duplicate.projectName || duplicate.stage?.project?.name || '';
  if (duplicateStageId && media.stageId && duplicateStageId === media.stageId) {
    return 'Uploaded twice on this stage';
  }
  const mediaProjectId = media.projectId || media.stage?.projectId || null;
  if (duplicateProjectId && mediaProjectId && duplicateProjectId === mediaProjectId) {
    return `Same photo as ${stageName}`;
  }
  if (viewer === 'admin') return `Used on another job: ${projectName}, ${stageName}`;
  return null;
}

export function provenanceLabels(media: any, viewer: MediaViewer): ProvenanceLabel {
  const source = media?.source || 'unknown';
  const when = new Date(media?.capturedAt ?? media?.createdAt ?? Date.now());
  const date = formatLabelTime(when);
  let label = 'Source not recorded';
  let tone: ProvenanceTone = 'neutral';

  if (source === 'unknown' && media?.sha256 == null && media?.capturedAt == null) {
    label = 'Uploaded before photo checks';
    tone = 'neutral';
  } else if (source === 'unknown') {
    label = 'Source not recorded';
    tone = 'neutral';
  } else if (source === 'admin_upload') {
    label = `Added by BMH admin, ${date}`;
    tone = 'neutral';
  } else if (source === 'gallery') {
    label = 'From gallery, location not checked';
    tone = 'warn';
  } else if (source === 'whatsapp') {
    label = 'Sent by WhatsApp, location not checked';
    tone = 'neutral';
  } else if (source === 'camera') {
    if (media?.captureLat == null || media?.captureLng == null) {
      label = 'Location not available';
      tone = 'warn';
    } else if (media?.accuracyMeters != null && Number(media.accuracyMeters) > MAX_USEFUL_ACCURACY_METERS) {
      label = 'Location too rough to check';
      tone = 'warn';
    } else if (media?.distanceFromSiteMeters == null) {
      label = `Taken ${date}, site location not set`;
      tone = 'neutral';
    } else if (Number(media.distanceFromSiteMeters) <= ON_SITE_RADIUS_METERS) {
      label = `Taken on site, ${date}`;
      tone = 'ok';
    } else {
      label = `Taken ${formatDistance(Number(media.distanceFromSiteMeters))} from site`;
      tone = 'warn';
    }
  }

  const duplicateLabel = duplicateText(media, viewer);
  if (duplicateLabel) tone = 'warn';
  return { label, duplicateLabel, tone };
}

export async function findDuplicateMedia(
  prisma: { stageMedia: { findFirst: (args: any) => Promise<{ id: string } | null> } },
  hashes: { sha256: string | null; originalSha256: string | null },
): Promise<string | null> {
  const or: Array<Record<string, string>> = [];
  if (hashes.sha256) or.push({ sha256: hashes.sha256 });
  if (hashes.originalSha256) or.push({ originalSha256: hashes.originalSha256 });
  if (or.length === 0) return null;
  const row = await prisma.stageMedia.findFirst({
    where: { OR: or },
    orderBy: { createdAt: 'asc' },
  });
  return row?.id ?? null;
}
