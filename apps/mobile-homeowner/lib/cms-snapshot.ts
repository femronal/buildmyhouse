import snapshotJson from '@/lib/cms-snapshot.generated.json';
import { articleFromRemote, type Article } from '@/lib/articles';
import type { CmsServicePageRecord } from '@/lib/cms-service-pages';

type CmsSnapshotFile = {
  articles?: unknown[];
  servicePages?: CmsServicePageRecord[];
};

const snapshot = snapshotJson as CmsSnapshotFile;

export function getSnapshotArticleBySlug(slug?: string): Article | undefined {
  if (!slug) return undefined;
  const match = (snapshot.articles || []).find((item) => {
    if (!item || typeof item !== 'object') return false;
    return String((item as { slug?: string }).slug || '') === slug;
  });
  return articleFromRemote(match);
}

function snapshotArticleRoute(record: { slug?: string; canonicalPath?: string }): string {
  const canonical = String(record.canonicalPath || '').trim();
  if (canonical.startsWith('/articles/')) return canonical;
  const slug = String(record.slug || '').trim();
  if (!canonical && slug) return `/articles/${slug}`;
  return '';
}

export function getSnapshotArticleSlugs(): string[] {
  const slugs = new Set<string>();
  for (const item of snapshot.articles || []) {
    if (!item || typeof item !== 'object') continue;
    const record = item as { slug?: string; isPublished?: boolean; canonicalPath?: string };
    if (record.isPublished === false) continue;
    const slug = String(record.slug || '').trim();
    if (!slug || !snapshotArticleRoute(record)) continue;
    slugs.add(slug);
  }
  return [...slugs];
}

export function getSnapshotServicePageByPath(canonicalPath: string): CmsServicePageRecord | undefined {
  return (snapshot.servicePages || []).find(
    (page) => page?.isPublished !== false && page?.canonicalPath === canonicalPath,
  );
}

export function getSnapshotServiceCanonicalPaths(): string[] {
  const paths = new Set<string>();
  for (const page of snapshot.servicePages || []) {
    if (page?.isPublished === false) continue;
    const canonical = String(page?.canonicalPath || '').trim();
    if (canonical.startsWith('/services/')) paths.add(canonical);
  }
  return [...paths];
}
