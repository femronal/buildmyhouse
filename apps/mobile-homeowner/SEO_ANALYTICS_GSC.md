# SEO Analytics and Search Console Setup

## 1) Google Search Console

1. Add property for `https://buildmyhouse.app`.
2. Verify ownership using the HTML meta token:
   - Set `EXPO_PUBLIC_GSC_VERIFICATION` in deploy environment.
3. Submit sitemap:
   - `https://buildmyhouse.app/sitemap.xml`
4. Inspect and request indexing for priority pages:
   - `/construction/nigeria`
   - `/construction/lagos`
   - `/construction/abuja`
   - `/construction/port-harcourt`
   - `/diaspora/build-in-nigeria-from-uk`
   - `/diaspora/build-in-nigeria-from-usa-canada`
   - `/diaspora/build-in-nigeria-from-uae`

## 2) GA4 setup

1. Create GA4 property for BuildMyHouse web.
2. Copy measurement ID (`G-XXXXXXXXXX`).
3. Set `EXPO_PUBLIC_GA_MEASUREMENT_ID` in environment.
4. Deploy homeowner web app.
5. Validate in GA4 Realtime report.

## 3) Recommended conversion events

Track these events for balanced acquisition goals:
- `seo_start_project_click`
- `seo_explore_listing_click`
- `seo_rent_listing_click`
- `seo_gc_signup_intent_click`
- `seo_contact_support_click`

Implementation note:
- Add `window.gtag('event', ...)` wrappers in CTA handlers on SEO landing pages when needed.

## 4) KPI dashboard (cluster-level)

Use Looker Studio or GA4 explorations with the following segments:

- **Service cluster**: `/construction/*`, `/renovation/*`, `/interior-design/*`
- **Geo cluster**: `/construction/lagos`, `/construction/abuja`, `/construction/port-harcourt`
- **Diaspora cluster**: `/diaspora/*`
- **Real-estate cluster**: `/homes-for-rent/*`, `/houses-for-sale/*`, `/land-for-sale/*`

Track weekly:
- Google impressions
- Clicks
- CTR
- Average position
- Organic sessions
- Conversion rate by landing page

## 5) 90-day targets

- Non-brand impressions: +30% to +60%
- Top-20 rankings: 15-30 target keywords
- Top-10 rankings: 5-10 (geo and diaspora long-tail)
- Balanced conversion lift across homeowner/property/GC funnels
