import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';
import {
  distanceFromSite,
  findDuplicateMedia,
  formatLabelTime,
  haversineMeters,
  isSha256Hex,
  normalizeCaptureLocation,
  normalizeCapturedAt,
  provenanceLabels,
  resolveSource,
  signFingerprint,
  verifyFingerprint,
} from './stage-media-provenance';

const WHEN = new Date('2026-11-09T13:14:00.000Z');
const HASH = 'ab'.repeat(32);
const OTHER_HASH = 'cd'.repeat(32);

function cameraMedia(distance: number | null, extra: Record<string, unknown> = {}) {
  return {
    source: 'camera',
    captureLat: 6.4541,
    captureLng: 3.3947,
    accuracyMeters: 12,
    distanceFromSiteMeters: distance,
    capturedAt: WHEN,
    createdAt: WHEN,
    stageId: 'stage-a',
    projectId: 'project-a',
    ...extra,
  };
}

function buildService() {
  const prisma: any = {
    stage: { findUnique: jest.fn() },
    stageMedia: {
      findFirst: jest.fn(),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(async ({ data }: { data: any }) => ({ id: 'new-media', ...data })),
    },
  };
  const wsService = { sendNotification: jest.fn().mockResolvedValue(undefined) };
  const service = new ProjectsService(
    wsService as any,
    {} as any,
    {} as any,
    { get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined) } as any,
    {} as any,
    {} as any,
  );
  (service as any).prisma = prisma;
  return { service, prisma, wsService };
}

function stageRecord(projectId = 'p1') {
  return {
    id: 's1',
    name: 'Roof',
    projectId,
    project: {
      id: projectId,
      name: 'House',
      homeownerId: 'home-1',
      latitude: 6.4541,
      longitude: 3.3947,
    },
  };
}

const actor = { userId: 'gc-1', role: 'general_contractor' };

describe('stage media provenance', () => {
  it('1. haversineMeters for the same point is 0', () => {
    expect(haversineMeters(6.4541, 3.3947, 6.4541, 3.3947)).toBe(0);
  });

  it('2. haversineMeters from Lagos Island to Ikeja is between 16500 and 17500 m', () => {
    const meters = haversineMeters(6.4541, 3.3947, 6.6018, 3.3515);
    expect(meters).toBeGreaterThan(16500);
    expect(meters).toBeLessThan(17500);
  });

  it('3. distanceFromSite returns null when the project latitude is null', () => {
    expect(distanceFromSite({ lat: 6.45, lng: 3.39 }, { latitude: null, longitude: 3.39 })).toBeNull();
  });

  it('4. distanceFromSite returns null when the project longitude is null', () => {
    expect(distanceFromSite({ lat: 6.45, lng: 3.39 }, { latitude: 6.45, longitude: null })).toBeNull();
  });

  it('5. distanceFromSite returns null when the capture lat or lng is null', () => {
    expect(distanceFromSite({ lat: null, lng: 3.39 }, { latitude: 6.45, longitude: 3.39 })).toBeNull();
    expect(distanceFromSite({ lat: 6.45, lng: null }, { latitude: 6.45, longitude: 3.39 })).toBeNull();
  });

  it('6. distanceFromSite returns a whole number when everything is set', () => {
    const meters = distanceFromSite({ lat: 6.4541, lng: 3.3947 }, { latitude: 6.6018, longitude: 3.3515 });
    expect(meters).not.toBeNull();
    expect(Number.isInteger(meters)).toBe(true);
  });

  it('7. normalizeCaptureLocation with lat 95 returns all nulls', () => {
    expect(normalizeCaptureLocation({ lat: 95, lng: 3.39, accuracyMeters: 5 })).toEqual({
      lat: null,
      lng: null,
      accuracyMeters: null,
    });
  });

  it('8. normalizeCaptureLocation with lng -181 returns all nulls', () => {
    expect(normalizeCaptureLocation({ lat: 6.45, lng: -181, accuracyMeters: 5 })).toEqual({
      lat: null,
      lng: null,
      accuracyMeters: null,
    });
  });

  it('9. normalizeCaptureLocation with NaN accuracy keeps lat and lng', () => {
    expect(normalizeCaptureLocation({ lat: 6.5, lng: 3.4, accuracyMeters: Number.NaN })).toEqual({
      lat: 6.5,
      lng: 3.4,
      accuracyMeters: null,
    });
  });

  it('10. normalizeCaptureLocation with undefined input returns all nulls', () => {
    expect(normalizeCaptureLocation(undefined)).toEqual({ lat: null, lng: null, accuracyMeters: null });
    expect(normalizeCaptureLocation()).toEqual({ lat: null, lng: null, accuracyMeters: null });
  });

  it('11. normalizeCapturedAt rejects a bad value, a far future time, and keeps an earlier time', () => {
    const now = new Date('2026-11-09T12:00:00.000Z');
    expect(normalizeCapturedAt('not a date', now)).toBeNull();
    expect(normalizeCapturedAt(undefined, now)).toBeNull();
    expect(normalizeCapturedAt(new Date(now.getTime() + 10 * 60 * 1000).toISOString(), now)).toBeNull();
    const kept = normalizeCapturedAt(new Date(now.getTime() - 60 * 60 * 1000).toISOString(), now);
    expect(kept).toBeInstanceOf(Date);
    expect(kept?.toISOString()).toBe(new Date(now.getTime() - 60 * 60 * 1000).toISOString());
  });

  it('12. resolveSource with role admin and captureMethod camera gives admin_upload', () => {
    expect(resolveSource({ role: 'admin', captureMethod: 'camera' })).toBe('admin_upload');
  });

  it('13. resolveSource for a GC with camera gives camera', () => {
    expect(resolveSource({ role: 'general_contractor', captureMethod: 'camera' })).toBe('camera');
  });

  it('14. resolveSource for a GC with gallery gives gallery', () => {
    expect(resolveSource({ role: 'general_contractor', captureMethod: 'gallery' })).toBe('gallery');
  });

  it('15. resolveSource for a GC never accepts admin_upload, whatsapp, or an unknown method', () => {
    expect(resolveSource({ role: 'general_contractor', captureMethod: 'admin_upload' })).toBe('unknown');
    expect(resolveSource({ role: 'general_contractor', captureMethod: 'whatsapp' })).toBe('unknown');
    expect(resolveSource({ role: 'general_contractor', captureMethod: undefined })).toBe('unknown');
    expect(resolveSource({ role: 'general_contractor', captureMethod: 'xyz' })).toBe('unknown');
  });

  it('16. sign then verify with the same payload returns true', () => {
    const payload = { userId: 'user-1', url: 'https://cdn.example/a.jpg', sha256: HASH, originalSha256: OTHER_HASH };
    const token = signFingerprint('test-secret', payload);
    expect(verifyFingerprint('test-secret', payload, token)).toBe(true);
  });

  it('17. verify returns false when url, userId, sha256, or originalSha256 changes', () => {
    const payload = { userId: 'user-1', url: 'https://cdn.example/a.jpg', sha256: HASH, originalSha256: OTHER_HASH };
    const token = signFingerprint('test-secret', payload);
    expect(verifyFingerprint('test-secret', { ...payload, url: 'https://cdn.example/b.jpg' }, token)).toBe(false);
    expect(verifyFingerprint('test-secret', { ...payload, userId: 'user-2' }, token)).toBe(false);
    expect(verifyFingerprint('test-secret', { ...payload, sha256: OTHER_HASH }, token)).toBe(false);
    expect(verifyFingerprint('test-secret', { ...payload, originalSha256: HASH }, token)).toBe(false);
  });

  it('18. verify returns false and does not throw for an empty token or a different length', () => {
    const payload = { userId: 'user-1', url: 'https://cdn.example/a.jpg', sha256: HASH, originalSha256: '' };
    expect(() => verifyFingerprint('test-secret', payload, '')).not.toThrow();
    expect(verifyFingerprint('test-secret', payload, '')).toBe(false);
    expect(() => verifyFingerprint('test-secret', payload, 'short')).not.toThrow();
    expect(verifyFingerprint('test-secret', payload, 'short')).toBe(false);
  });

  it('19. isSha256Hex accepts 64 lowercase hex characters and rejects the rest', () => {
    expect(isSha256Hex(HASH)).toBe(true);
    expect(isSha256Hex('a'.repeat(63))).toBe(false);
    expect(isSha256Hex(HASH.toUpperCase())).toBe(false);
    expect(isSha256Hex(`${'g'.repeat(64)}`)).toBe(false);
  });

  it('22. findDuplicateMedia with only sha256 queries that hash and returns the first id', async () => {
    const prisma = { stageMedia: { findFirst: jest.fn().mockResolvedValue({ id: 'm1' }) } };
    const id = await findDuplicateMedia(prisma as any, { sha256: HASH, originalSha256: null });
    expect(prisma.stageMedia.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ sha256: HASH }] },
      orderBy: { createdAt: 'asc' },
    });
    expect(id).toBe('m1');
  });

  it('23. findDuplicateMedia with both hashes queries both', async () => {
    const prisma = { stageMedia: { findFirst: jest.fn().mockResolvedValue({ id: 'm2' }) } };
    await findDuplicateMedia(prisma as any, { sha256: HASH, originalSha256: OTHER_HASH });
    expect(prisma.stageMedia.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ sha256: HASH }, { originalSha256: OTHER_HASH }] },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('24. findDuplicateMedia with both hashes null does not query', async () => {
    const prisma = { stageMedia: { findFirst: jest.fn() } };
    const id = await findDuplicateMedia(prisma as any, { sha256: null, originalSha256: null });
    expect(prisma.stageMedia.findFirst).not.toHaveBeenCalled();
    expect(id).toBeNull();
  });

  it('25. a matching sha256 on another project stores duplicateOfMediaId and still succeeds', async () => {
    const { service, prisma, wsService } = buildService();
    prisma.stage.findUnique.mockResolvedValue(stageRecord());
    prisma.stageMedia.findFirst.mockResolvedValue({ id: 'older-media' });
    const url = 'https://cdn.example/dup.jpg';
    const token = signFingerprint('test-secret', { userId: 'gc-1', url, sha256: HASH, originalSha256: '' });
    const saved = await service.addStageMedia('s1', {
      type: 'photo',
      url,
      sha256: HASH,
      fingerprintToken: token,
    }, actor, 'p1');
    expect(prisma.stageMedia.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ sha256: HASH, duplicateOfMediaId: 'older-media' }),
    });
    expect(saved.id).toBe('new-media');
    expect(wsService.sendNotification).toHaveBeenCalledWith('home-1', expect.objectContaining({
      type: 'stage_media_added',
      title: 'Files added',
      message: 'Your GC added a photo to "Roof" for project "House".',
    }));
  });

  it('26. a bad fingerprintToken stores both hashes as null and still succeeds', async () => {
    const { service, prisma } = buildService();
    const warn = jest.fn();
    (service as any).logger.warn = warn;
    prisma.stage.findUnique.mockResolvedValue(stageRecord());
    const saved = await service.addStageMedia('s1', {
      type: 'photo',
      url: 'https://cdn.example/bad.jpg',
      sha256: HASH,
      originalSha256: OTHER_HASH,
      fingerprintToken: 'not-the-token',
    }, actor, 'p1');
    const data = prisma.stageMedia.create.mock.calls[0][0].data;
    expect(data.sha256).toBeNull();
    expect(data.originalSha256).toBeNull();
    expect(saved.id).toBe('new-media');
    expect(warn).toHaveBeenCalled();
    expect(prisma.stageMedia.findFirst).not.toHaveBeenCalled();
  });

  it('27. a gallery upload with lat and lng stores location and distance as null', async () => {
    const { service, prisma } = buildService();
    prisma.stage.findUnique.mockResolvedValue(stageRecord());
    await service.addStageMedia('s1', {
      type: 'photo',
      url: 'https://cdn.example/gallery.jpg',
      captureMethod: 'gallery',
      captureLat: 6.45,
      captureLng: 3.39,
      accuracyMeters: 12,
    }, actor, 'p1');
    const data = prisma.stageMedia.create.mock.calls[0][0].data;
    expect(data.source).toBe('gallery');
    expect(data.captureLat).toBeNull();
    expect(data.captureLng).toBeNull();
    expect(data.accuracyMeters).toBeNull();
    expect(data.distanceFromSiteMeters).toBeNull();
  });

  it('28. a camera upload with no location stores nulls and succeeds', async () => {
    const { service, prisma } = buildService();
    prisma.stage.findUnique.mockResolvedValue(stageRecord());
    const saved = await service.addStageMedia('s1', {
      type: 'photo',
      url: 'https://cdn.example/camera.jpg',
      captureMethod: 'camera',
    }, actor, 'p1');
    const data = prisma.stageMedia.create.mock.calls[0][0].data;
    expect(data.source).toBe('camera');
    expect(data.captureLat).toBeNull();
    expect(data.captureLng).toBeNull();
    expect(data.accuracyMeters).toBeNull();
    expect(data.distanceFromSiteMeters).toBeNull();
    expect(saved.provenance.label).toBe('Location not available');
  });

  it('29. a stage whose projectId is not the URL projectId throws NotFoundException', async () => {
    const { service, prisma } = buildService();
    prisma.stage.findUnique.mockResolvedValue(stageRecord('p1'));
    await expect(service.addStageMedia('s1', {
      type: 'photo',
      url: 'https://cdn.example/a.jpg',
    }, actor, 'other-project')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.stageMedia.create).not.toHaveBeenCalled();
  });

  it('30. a GC body with extra source admin_upload still stores camera', async () => {
    const { service, prisma } = buildService();
    prisma.stage.findUnique.mockResolvedValue(stageRecord());
    await service.addStageMedia('s1', {
      type: 'photo',
      url: 'https://cdn.example/a.jpg',
      captureMethod: 'camera',
      source: 'admin_upload',
    } as any, actor, 'p1');
    const data = prisma.stageMedia.create.mock.calls[0][0].data;
    expect(data.source).toBe('camera');
    expect(data).not.toHaveProperty('captureMethod');
    expect(data.uploadedByUserId).toBe('gc-1');
  });

  it('31. an old row gives Uploaded before photo checks', () => {
    expect(provenanceLabels({
      source: 'unknown',
      sha256: null,
      capturedAt: null,
      createdAt: WHEN,
    }, 'homeowner')).toEqual({
      label: 'Uploaded before photo checks',
      duplicateLabel: null,
      tone: 'neutral',
    });
  });

  it('32. camera at 120 m gives Taken on site with tone ok', () => {
    expect(provenanceLabels(cameraMedia(120), 'homeowner')).toEqual({
      label: `Taken on site, ${formatLabelTime(WHEN)}`,
      duplicateLabel: null,
      tone: 'ok',
    });
  });

  it('33. camera at 2400 m gives Taken 2.4 km from site', () => {
    expect(provenanceLabels(cameraMedia(2400), 'homeowner').label).toBe('Taken 2.4 km from site');
  });

  it('34. camera at 850 m gives Taken 850 m from site', () => {
    expect(provenanceLabels(cameraMedia(850), 'homeowner').label).toBe('Taken 850 m from site');
  });

  it('35. camera with no lat or lng gives Location not available', () => {
    expect(provenanceLabels(cameraMedia(20, { captureLat: null, captureLng: null }), 'homeowner')).toMatchObject({
      label: 'Location not available',
      tone: 'warn',
    });
  });

  it('36. camera with accuracy 1500 gives Location too rough to check', () => {
    expect(provenanceLabels(cameraMedia(20, { accuracyMeters: 1500 }), 'homeowner')).toMatchObject({
      label: 'Location too rough to check',
      tone: 'warn',
    });
  });

  it('37. camera on a project with no site location gives the site location label', () => {
    expect(provenanceLabels(cameraMedia(null), 'homeowner')).toEqual({
      label: `Taken ${formatLabelTime(WHEN)}, site location not set`,
      duplicateLabel: null,
      tone: 'neutral',
    });
  });

  it('38. gallery gives From gallery, location not checked', () => {
    expect(provenanceLabels({ source: 'gallery', capturedAt: WHEN }, 'homeowner')).toMatchObject({
      label: 'From gallery, location not checked',
      tone: 'warn',
    });
  });

  it('39. same project, other stage gives Same photo as the stage name', () => {
    const label = provenanceLabels({
      ...cameraMedia(120),
      duplicateOf: {
        id: 'older',
        stageId: 'stage-b',
        stage: { name: 'Roof deck', projectId: 'project-a', project: { name: 'House' } },
      },
    }, 'homeowner');
    expect(label.duplicateLabel).toBe('Same photo as Roof deck');
    expect(label.tone).toBe('warn');
  });

  it('40. same stage gives Uploaded twice on this stage', () => {
    const label = provenanceLabels({
      ...cameraMedia(120),
      duplicateOf: {
        id: 'older',
        stageId: 'stage-a',
        stage: { name: 'Foundation', projectId: 'project-a', project: { name: 'House' } },
      },
    }, 'gc');
    expect(label.duplicateLabel).toBe('Uploaded twice on this stage');
  });

  it('41. another project gives a homeowner no duplicate label', () => {
    const label = provenanceLabels({
      ...cameraMedia(120),
      duplicateOf: {
        id: 'older',
        stageId: 'stage-x',
        stage: { name: 'Fence', projectId: 'project-b', project: { name: 'Other house' } },
      },
    }, 'homeowner');
    expect(label.duplicateLabel).toBeNull();
  });

  it('42. another project gives an admin the job and stage names', () => {
    const label = provenanceLabels({
      ...cameraMedia(120),
      duplicateOf: {
        id: 'older',
        stageId: 'stage-x',
        stage: { name: 'Fence', projectId: 'project-b', project: { name: 'Other house' } },
      },
    }, 'admin');
    expect(label.duplicateLabel).toBe('Used on another job: Other house, Fence');
    expect(label.tone).toBe('warn');
  });

  it('43. formatLabelTime for 2026-11-09T13:14:00Z gives 9 Nov, 2:14pm', () => {
    expect(formatLabelTime(new Date('2026-11-09T13:14:00Z'))).toBe('9 Nov, 2:14pm');
  });

  it('44. a homeowner project hides raw photo fields and the other project', () => {
    const { service } = buildService();
    const otherProjectId = 'OTHER_PROJECT_ID_ZX91';
    const otherProjectName = 'OTHER_PROJECT_NAME_ZX91';
    const otherStageName = 'OTHER_STAGE_NAME_ZX91';
    const project = {
      id: 'p1',
      name: 'This House',
      stages: [{
        id: 's1',
        media: [{
          id: 'm1',
          stageId: 's1',
          type: 'photo',
          url: 'https://cdn.example/a.jpg',
          source: 'camera',
          capturedAt: WHEN,
          createdAt: WHEN,
          captureLat: 6.45,
          captureLng: 3.39,
          accuracyMeters: 12,
          distanceFromSiteMeters: 120,
          sha256: HASH,
          originalSha256: OTHER_HASH,
          uploadedByUserId: 'user-uploader',
          duplicateOfMediaId: 'm-old',
          uploadedBy: { id: 'user-uploader', fullName: 'Chidi', role: 'general_contractor' },
          duplicateOf: {
            id: 'm-old',
            stageId: 's-other',
            stage: { name: otherStageName, projectId: otherProjectId, project: { name: otherProjectName } },
          },
        }],
      }],
    };
    const shaped = (service as any).attachMediaProvenance(project, 'homeowner');
    const row = shaped.stages[0].media[0];
    expect(row.captureLat).toBeUndefined();
    expect(row.sha256).toBeUndefined();
    expect(row.originalSha256).toBeUndefined();
    expect(row.duplicateOf).toBeUndefined();
    expect(row.uploadedBy).toBeUndefined();
    expect(row.uploadedByUserId).toBeUndefined();
    expect(row.source).toBe('camera');
    expect(row.provenance.duplicateLabel).toBeNull();
    const json = JSON.stringify(shaped);
    expect(json).not.toContain(otherProjectId);
    expect(json).not.toContain(otherProjectName);
    expect(json).not.toContain(otherStageName);
  });

  it('45. an admin project keeps raw photo fields and the other project name', () => {
    const { service } = buildService();
    const project = {
      id: 'p1',
      name: 'This House',
      stages: [{
        id: 's1',
        media: [{
          id: 'm1',
          stageId: 's1',
          type: 'photo',
          url: 'https://cdn.example/a.jpg',
          source: 'camera',
          capturedAt: WHEN,
          createdAt: WHEN,
          captureLat: 6.45,
          captureLng: 3.39,
          accuracyMeters: 12,
          distanceFromSiteMeters: 120,
          sha256: HASH,
          originalSha256: OTHER_HASH,
          uploadedBy: { id: 'user-uploader', fullName: 'Chidi', role: 'general_contractor' },
          duplicateOf: {
            id: 'm-old',
            stageId: 's-other',
            stage: { name: 'Fence', projectId: 'project-b', project: { name: 'Other house' } },
          },
        }],
      }],
    };
    const shaped = (service as any).attachMediaProvenance(project, 'admin');
    const row = shaped.stages[0].media[0];
    expect(row.captureLat).toBe(6.45);
    expect(row.captureLng).toBe(3.39);
    expect(row.sha256).toBe(HASH);
    expect(row.originalSha256).toBe(OTHER_HASH);
    expect(row.uploadedBy.fullName).toBe('Chidi');
    expect(row.duplicateOf).toEqual({
      id: 'm-old',
      stageId: 's-other',
      stageName: 'Fence',
      projectId: 'project-b',
      projectName: 'Other house',
    });
  });
});
