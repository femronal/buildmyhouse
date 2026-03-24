# BuildMyHouse Homeowner App

Expo Router application for homeowners (mobile + web).

## Development

```bash
pnpm install
pnpm --filter mobile-homeowner start
```

## Web build

```bash
pnpm --filter mobile-homeowner build
```

The build step runs SEO file generation first, then exports the static web bundle:
- `generate-seo-files.mjs` -> creates `public/sitemap.xml` and `public/robots.txt`
- `expo export --platform web`

## SEO environment variables

Use `apps/mobile-homeowner/.env.example` as reference.

- `EXPO_PUBLIC_WEB_URL` - canonical base URL (e.g. `https://buildmyhouse.app`)
- `EXPO_PUBLIC_GSC_VERIFICATION` - Google Search Console verification token
- `EXPO_PUBLIC_GA_MEASUREMENT_ID` - GA4 measurement ID (`G-XXXXXXXXXX`)

## SEO routing rules

- Indexable routes are controlled in `lib/seo.ts` (`isIndexablePath`).
- Private/product routes are set to `noindex,nofollow` by default.
- Public acquisition routes (service/city/diaspora pages) are `index,follow`.

## SEO docs

- `SEO_ANALYTICS_GSC.md` - Search Console + GA4 setup and KPI tracking
- `SEO_CONTENT_WORKFLOW.md` - BuildMyHouse-first + Medium canonical workflow
