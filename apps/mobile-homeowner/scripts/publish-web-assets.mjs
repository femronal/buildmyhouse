#!/usr/bin/env node
/**
 * Upload the Expo web export with:
 * - long cache on hashed /_expo assets
 * - no-cache on HTML
 * - brotli and gzip siblings for JS, CSS, JSON, and SVG
 *
 * CloudFront's automatic compression skips files over 10MB, so the viewer
 * function rewrites those asset URLs to the precompressed objects.
 *
 * Without AWS_S3_BUCKET_HOMEOWNER this only writes the compressed siblings
 * and prints entry sizes, so a local build can be measured before deploy.
 */
import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import zlib from 'node:zlib';

const execFileAsync = promisify(execFile);
const bucket = process.env.AWS_S3_BUCKET_HOMEOWNER || '';
const region = process.env.AWS_REGION || 'eu-north-1';
const distDir = path.resolve(process.cwd(), 'dist');
const COMPRESSIBLE = new Set(['.js', '.css', '.json', '.svg']);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

if (!fs.existsSync(distDir)) {
  throw new Error(`[web] Missing export directory ${distDir}`);
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function relPath(file) {
  return path.relative(distDir, file).split(path.sep).join('/');
}

function writeCompressed(file) {
  const ext = path.extname(file).toLowerCase();
  if (!COMPRESSIBLE.has(ext)) return;
  if (file.endsWith('.br') || file.endsWith('.gz')) return;
  const raw = fs.readFileSync(file);
  fs.writeFileSync(
    `${file}.br`,
    zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }),
  );
  fs.writeFileSync(`${file}.gz`, zlib.gzipSync(raw, { level: 9 }));
}

function objectHeaders(rel) {
  let encoding = '';
  let base = rel;
  if (rel.endsWith('.br')) {
    encoding = 'br';
    base = rel.slice(0, -3);
  } else if (rel.endsWith('.gz')) {
    encoding = 'gzip';
    base = rel.slice(0, -3);
  }
  const ext = path.extname(base).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
  const hashed =
    rel.includes('_expo/static/') ||
    /-[a-f0-9]{8,}\.(js|css|json|svg|png|jpe?g|webp)(\.(br|gz))?$/.test(rel);
  const cacheControl = base.endsWith('.html')
    ? 'public, max-age=0, must-revalidate'
    : hashed
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=3600';
  return { contentType, encoding, cacheControl };
}

async function upload(file, rel) {
  const headers = objectHeaders(rel);
  const args = [
    's3',
    'cp',
    file,
    `s3://${bucket}/${rel}`,
    '--region',
    region,
    '--content-type',
    headers.contentType,
    '--cache-control',
    headers.cacheControl,
    '--only-show-errors',
  ];
  if (headers.encoding) args.push('--content-encoding', headers.encoding);
  await execFileAsync('aws', args);
}

async function pool(items, limit, worker) {
  const queue = items.slice();
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (queue.length) {
        const item = queue.shift();
        await worker(item);
      }
    }),
  );
}

function listRemoteKeys() {
  const output = execFileSync('aws', ['s3', 'ls', `s3://${bucket}`, '--recursive', '--region', region], {
    encoding: 'utf8',
  });
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/).slice(3).join(' '))
    .filter(Boolean);
}

for (const file of walk(distDir)) {
  if (file.endsWith('.br') || file.endsWith('.gz')) continue;
  writeCompressed(file);
}

const localFiles = walk(distDir);
const localKeys = new Set(localFiles.map(relPath));
const entry = localFiles
  .map(relPath)
  .filter((rel) => /\/entry-.*\.js$/.test(rel) && !rel.endsWith('.br') && !rel.endsWith('.gz'))
  .sort((a, b) => fs.statSync(path.join(distDir, b)).size - fs.statSync(path.join(distDir, a)).size)[0];

if (entry) {
  const raw = fs.statSync(path.join(distDir, entry)).size;
  const br = fs.statSync(path.join(distDir, `${entry}.br`)).size;
  const gz = fs.statSync(path.join(distDir, `${entry}.gz`)).size;
  const headers = objectHeaders(entry);
  console.log(`[web] ${entry}`);
  console.log(`[web] raw ${raw} brotli ${br} gzip ${gz}`);
  console.log(`[web] cache-control ${headers.cacheControl}`);
}

if (!bucket) {
  console.log('[web] Skipped upload: AWS_S3_BUCKET_HOMEOWNER not set');
  process.exit(0);
}

console.log(`[web] Uploading ${localKeys.size} objects to s3://${bucket}`);
await pool(localFiles, 12, async (file) => {
  await upload(file, relPath(file));
});

const stale = listRemoteKeys().filter((key) => !localKeys.has(key));
if (stale.length) {
  console.log(`[web] Removing ${stale.length} stale objects`);
  await pool(stale, 12, async (key) => {
    await execFileAsync('aws', ['s3', 'rm', `s3://${bucket}/${key}`, '--region', region, '--only-show-errors']);
  });
}

console.log('[web] Upload complete');
