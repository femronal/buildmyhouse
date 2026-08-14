import { articles } from '@/lib/articles';
import { amalaJointTrackingStoryBlocks } from '@/lib/amala-joint-tracking-story';
import {
  buildArticleReadingAids,
  buildStoryReadingAids,
  injectHeadingIdsIntoHtml,
  readingProgressFromOffsets,
  slugifyHeading,
} from '@/lib/blog-reading-chrome';

describe('blog reading chrome helpers', () => {
  it('slugifies headings for anchor ids', () => {
    expect(slugifyHeading('How to stay in control')).toBe('how-to-stay-in-control');
    expect(slugifyHeading('What “verified” means—and what it does not mean')).toContain('verified');
  });

  it('derives toc + takeaways from bundled articles without per-post config', () => {
    const article = articles.find((item) => item.slug === 'cost-to-build-house-in-nigeria-2026');
    expect(article).toBeTruthy();
    const aids = buildArticleReadingAids(article!);
    expect(aids.toc.map((item) => item.title)).toEqual(
      expect.arrayContaining(['Typical cost drivers', 'How to stay in control']),
    );
    expect(aids.takeaways.length).toBeGreaterThanOrEqual(2);
    expect(aids.takeaways[0]).toMatch(/labor|Location/i);
  });

  it('injects heading ids into article html in toc order', () => {
    const html = '<h2>One</h2><p>x</p><h2>Two</h2>';
    const next = injectHeadingIdsIntoHtml(html, [
      { id: 'one', title: 'One', level: 2 },
      { id: 'two', title: 'Two', level: 2 },
    ]);
    expect(next).toContain('<h2 id="one">');
    expect(next).toContain('<h2 id="two">');
  });

  it('builds story toc from existing h2 ids and takeaways from pull quotes', () => {
    const aids = buildStoryReadingAids(amalaJointTrackingStoryBlocks);
    expect(aids.toc.length).toBeGreaterThanOrEqual(4);
    expect(aids.toc[0]).toMatchObject({
      id: 'it-didnt-begin-in-istanbul',
      title: "It didn't begin in Istanbul",
    });
    expect(aids.takeaways.length).toBeGreaterThanOrEqual(1);
    expect(aids.takeaways[0]).toMatch(/Femi|trust|system|evidence/i);
  });

  it('clamps reading progress between 0 and 1', () => {
    expect(readingProgressFromOffsets(0, 1000, 500)).toBe(0);
    expect(readingProgressFromOffsets(250, 1000, 500)).toBe(0.5);
    expect(readingProgressFromOffsets(9999, 1000, 500)).toBe(1);
  });
});
