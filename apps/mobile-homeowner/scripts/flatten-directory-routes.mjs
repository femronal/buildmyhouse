/**
 * Expo web export puts nested routes at `path/index.html`.
 * CloudFront viewer-request rewrites extensionless URLs to `path.html`.
 * Copy each nested index.html to a sibling path.html so clean URLs resolve.
 */
import fs from 'node:fs';
import path from 'node:path';

const distRoot = path.resolve(process.cwd(), 'dist');

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full);
      continue;
    }
    if (ent.name !== 'index.html') continue;
    if (full === path.join(distRoot, 'index.html')) continue;

    const folder = path.dirname(full);
    const siblingHtml = `${folder}.html`;
    fs.copyFileSync(full, siblingHtml);
    console.log(
      `[flatten-routes] ${path.relative(distRoot, full)} → ${path.relative(distRoot, siblingHtml)}`,
    );
  }
}

if (!fs.existsSync(distRoot)) {
  console.error(`[flatten-routes] Missing dist at ${distRoot}`);
  process.exit(1);
}

walk(distRoot);
console.log('[flatten-routes] Done');
