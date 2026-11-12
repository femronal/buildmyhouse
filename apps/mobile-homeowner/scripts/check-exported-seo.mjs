/**
 * Fail the build if any exported page tells Google that its canonical URL
 * still contains a route placeholder such as [slug] or [token].
 */
import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

if (!fs.existsSync(distDir)) {
  console.error('[seo] dist/ is missing.');
  process.exit(1);
}

const problems = [];
const files = walk(distDir);
for (const filePath of files) {
  const html = fs.readFileSync(filePath, 'utf8');
  const tags = html.match(/<(?:link|meta)\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const isCanonical = /rel=["']canonical["']/i.test(tag);
    const isOgUrl = /property=["']og:url["']/i.test(tag);
    if (!isCanonical && !isOgUrl) continue;
    if (/\[[^\]]+\]/.test(tag)) problems.push(`${path.relative(distDir, filePath)}: ${tag}`);
  }
}

if (problems.length) {
  console.error('[seo] Exported HTML has a placeholder in a canonical or og:url:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`[seo] Checked ${files.length} HTML files. No placeholder canonical or og:url.`);
