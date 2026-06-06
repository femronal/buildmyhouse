# SEO Canonical Map (BuildMyHouse)

Purpose: keep one canonical URL per page intent and avoid duplicate path variants that trigger "Alternate page with proper canonical tag" issues in Google Search Console.

## Canonical Rules

- Use exactly one public URL pattern per landing page/topic.
- If an old URL still exists, it must 301/308 redirect to the canonical URL.
- Internal links, sitemap URLs, JSON-LD paths, and SEO metadata must all use the same canonical URL.
- Do not keep both "country-subfolder" and "from-country" variants live for the same page intent.

## Current Canonical Decisions

### Diaspora build pages

- Canonical: `/diaspora/build-in-nigeria-from-abroad`
- Canonical: `/diaspora/build-in-nigeria-from-uk`
- Canonical: `/diaspora/build-in-nigeria-from-usa-canada`
- Canonical: `/diaspora/build-in-nigeria-from-uae`

### Diaspora build legacy aliases

- Legacy alias: `/diaspora/uk/build-in-nigeria`
- Status: redirect to `/diaspora/build-in-nigeria-from-uk`
- Legacy alias: `/diaspora/us/build-in-nigeria`
- Status: redirect to `/diaspora/build-in-nigeria-from-usa-canada`
- Do not use legacy aliases in new internal links or sitemap entries.

## Pre-merge Canonical Checklist

Before shipping any new SEO page:

1. Confirm route file path and `canonicalPath`/canonical URL match.
2. Confirm `useWebSeo()` canonical path matches sitemap entry.
3. Confirm JSON-LD `path`/`url` matches canonical page URL.
4. Confirm internal link blocks point to canonical URLs only.
5. Confirm any replaced legacy path redirects to canonical.

## Search Console Validation Workflow

1. Inspect canonical URL in URL Inspection.
2. Verify:
   - User-declared canonical = canonical URL
   - Google-selected canonical = same URL
3. Request indexing for canonical URL.
4. Run Validate Fix for related indexing issues.

