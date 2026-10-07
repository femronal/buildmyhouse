import files from '@/lib/available-public-pdfs.json';

const available = new Set<string>(files as string[]);

/** True unless href points at a /pdfs file that is not in public/pdfs at build time. */
export function isLocalPdfAvailable(href: string): boolean {
  if (!href.startsWith('/pdfs/')) return true;
  const name = href.slice('/pdfs/'.length);
  if (!name || name.includes('/')) return true;
  return available.has(name);
}
