/**
 * Compress existing public images. Originals stay in place.
 * Usage:
 *   pnpm prisma:compress-public-images -- --dry-run
 *   pnpm prisma:compress-public-images -- --limit 10
 */
import { CopyObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import { ImageCompressionService } from '../src/upload/image-compression.service';

const prisma = new PrismaClient();
const images = new ImageCompressionService();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitFlag = args.indexOf('--limit');
const limit = limitFlag >= 0 ? Math.max(1, Number(args[limitFlag + 1]) || 10) : 10;
const pauseMs = 400;

const bucket = (process.env.AWS_S3_BUCKET || '').trim();
const region = (process.env.AWS_REGION || '').trim();
const s3 = bucket && region ? new S3Client({ region }) : null;

type Job = {
  table: string;
  id: string;
  field: 'url' | 'pictureUrl' | 'imageUrl';
  url: string;
  thumbnailField?: 'thumbnailUrl';
};

function isPrivateUrl(url: string) {
  const value = url.toLowerCase();
  return value.includes('/files/') || value.includes('/vendor/') || value.includes('vendor-documents');
}

function objectKey(url: string): string | null {
  if (!url) return null;
  if (url.startsWith('/uploads/')) return url.replace(/^\/+/, '');
  try {
    const parsed = new URL(url);
    return decodeURIComponent(parsed.pathname.replace(/^\/+/, '')) || null;
  } catch {
    return null;
  }
}

async function readObject(key: string): Promise<{ buffer: Buffer; bytes: number } | null> {
  if (!s3) return null;
  const result = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = await result.Body?.transformToByteArray();
  if (!bytes) return null;
  return { buffer: Buffer.from(bytes), bytes: bytes.byteLength };
}

async function objectExists(key: string) {
  if (!s3) return false;
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const jobs: Job[] = [];
  const designImages = await prisma.designImage.findMany({
    where: { OR: [{ thumbnailUrl: null }, { thumbnailUrl: '' }] },
    select: { id: true, url: true, thumbnailUrl: true },
    take: limit,
  });
  for (const row of designImages) {
    if (!row.url || isPrivateUrl(row.url)) continue;
    jobs.push({ table: 'design_images', id: row.id, field: 'url', url: row.url, thumbnailField: 'thumbnailUrl' });
  }

  if (jobs.length < limit) {
    const users = await prisma.user.findMany({
      where: { pictureUrl: { not: null } },
      select: { id: true, pictureUrl: true },
      take: limit,
    });
    for (const row of users) {
      if (!row.pictureUrl || isPrivateUrl(row.pictureUrl) || row.pictureUrl.includes('.opt.webp')) continue;
      jobs.push({ table: 'users', id: row.id, field: 'pictureUrl', url: row.pictureUrl });
      if (jobs.length >= limit) break;
    }
  }

  console.log(`${dryRun ? 'Dry run' : 'Run'}: ${jobs.length} public image(s), limit ${limit}.`);
  let saved = 0;
  let beforeTotal = 0;
  let afterTotal = 0;

  for (const job of jobs) {
    const key = objectKey(job.url);
    if (!key || isPrivateUrl(key)) {
      console.log(`skip ${job.table} ${job.id}: private or unreadable url`);
      continue;
    }
    if (!s3) {
      console.log(`skip ${job.id}: storage is not configured`);
      continue;
    }
    const original = await readObject(key);
    if (!original) {
      console.log(`skip ${job.id}: object missing`);
      continue;
    }
    const sniffed = images.sniffImage(original.buffer);
    if (!sniffed.compressible) {
      console.log(`skip ${job.id}: ${sniffed.kind || 'not an image'} (${original.bytes} bytes)`);
      continue;
    }
    const prepared = await images.preparePublicPhoto(original.buffer);
    const optKey = key.replace(/(\.[^./]+)?$/, '.opt.webp');
    const cardKey = key.replace(/(\.[^./]+)?$/, '.card.webp');
    const backupKey = `uploads-backup/${key}`;
    beforeTotal += original.bytes;
    afterTotal += prepared.full.length + prepared.thumbnail.length;
    saved += original.bytes - prepared.full.length;
    console.log(
      `${job.table} ${job.id}: ${original.bytes} -> full ${prepared.full.length}, card ${prepared.thumbnail.length} (${sniffed.kind})`,
    );
    if (dryRun) continue;

    if (!(await objectExists(backupKey))) {
      await s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${key}`,
          Key: backupKey,
        }),
      );
    }
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: optKey,
        Body: prepared.full,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: cardKey,
        Body: prepared.thumbnail,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    const optHead = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: optKey }));
    if (!optHead.ContentLength) throw new Error(`Optimized file missing for ${optKey}`);
    const nextUrl = job.url.includes('://')
      ? job.url.replace(key, optKey)
      : `/${optKey}`;
    const thumbUrl = job.url.includes('://') ? job.url.replace(key, cardKey) : `/${cardKey}`;
    if (job.table === 'design_images') {
      await prisma.designImage.update({
        where: { id: job.id },
        data: { url: nextUrl, thumbnailUrl: thumbUrl },
      });
    } else if (job.table === 'users') {
      await prisma.user.update({ where: { id: job.id }, data: { pictureUrl: nextUrl } });
    }
    await new Promise((resolve) => setTimeout(resolve, pauseMs));
  }

  console.log(
    `Report: ${jobs.length} considered, ${beforeTotal} bytes before, ${afterTotal} bytes after, about ${saved} bytes saved on full images. Originals were not deleted.`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
