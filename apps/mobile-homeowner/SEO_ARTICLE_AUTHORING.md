# BuildMyHouse Article Authoring Guide

This project now includes a file-based article system for SEO pages under:

- `/articles`
- `/articles/[slug]`

## Where to edit content

All article content lives in:

- `lib/articles.ts`

Each article has:

- SEO metadata (title, description, canonical path)
- cover image
- tags, reading time, publish/update dates
- content blocks (paragraphs, bullets, images, YouTube embeds, CTA)
- FAQ entries
- internal links

## Supported content blocks

Inside each article `blocks` array:

- `heading`
- `paragraph`
- `bullets`
- `quote`
- `image` (remote image URL + caption)
- `youtube` (video ID + title + optional caption)
- `cta` (button label + link)

## Add a new article

1. Add a new object in `lib/articles.ts` with a unique `slug`.
2. Set `canonicalPath` to `/articles/<slug>`.
3. Add your article blocks and FAQs.
4. Add the same new route to `generate-seo-files.mjs` in `indexableRoutes`.
5. Run:

```bash
pnpm --filter mobile-homeowner build
```

6. Deploy and submit the new URL in Google Search Console.

## Notes on media

- Use optimized images (WebP or compressed JPEG).
- For YouTube embeds, use only the `videoId` (not full URL).
- Keep captions concise; they improve clarity and can support SEO context.

## Next phase (optional)

If you want non-technical publishing from Admin UI, phase 2 can add:

- backend `articles` tables
- admin article editor + publish workflow
- API delivery to homeowner app
- automated sitemap generation from database

---

## Phase 2 (now available)

You can now create and publish content from Admin Dashboard:

- Open `Admin Dashboard -> Content`
- Create article content using the JSON block editors
- Toggle publish/unpublish without editing app code

Current behavior:

- Homeowner article pages first load static seeded content (for stable SEO routes)
- Then fetch published CMS articles from backend
- Admin-published slugs can render live without app code changes
