import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSitemapIndex,
  buildUrlSet,
  canonicalRouteWithoutPlaceholder,
  chunkList,
  hasRoutePlaceholder,
  hubMatchForPath,
  listingHead,
  listingMatchesHub,
  sitemapFileNames,
} from '../lib/listing-public-seo.mjs';

test('listing title drops missing trade or city', () => {
  assert.equal(
    listingHead({
      segment: 'artisans',
      name: 'AM Energy Solar Engrs Ltd',
      slug: 'am-energy-solar-engrs-ltd',
      trade: 'Solar / Inverter Technician',
      city: 'Dutse, Bwari, Abuja',
      state: 'FCT',
      services: ['Battery check', 'Inverter installation', 'Lithium battery installation', 'Solar panel check'],
    }).title,
    'AM Energy Solar Engrs Ltd | Solar / Inverter Technician in Dutse, Bwari, Abuja | BuildMyHouse',
  );
  assert.equal(
    listingHead({ segment: 'vendors', name: 'Acme Blocks', slug: 'acme-blocks', state: 'Lagos' }).title,
    'Acme Blocks | Lagos | BuildMyHouse',
  );
  assert.equal(
    listingHead({ segment: 'professionals', name: 'Ada Law', slug: 'ada-law', trade: 'Architect' }).title,
    'Ada Law | Architect | BuildMyHouse',
  );
});

test('description uses only real fields and at most three services', () => {
  const head = listingHead({
    segment: 'artisans',
    name: 'Tunde Repairs',
    slug: 'tunde-repairs',
    trade: 'Plumber',
    city: 'Ikeja',
    state: 'Lagos',
    services: ['Burst pipes', 'Blocked drains', 'Water heaters', 'Fourth service'],
  });
  assert.equal(head.description, 'Tunde Repairs, Plumber, Ikeja, Lagos. Burst pipes, Blocked drains, Water heaters');
  assert.equal(head.description.includes('Fourth'), false);
  assert.equal(head.canonical, 'https://buildmyhouse.app/artisans/tunde-repairs');
  assert.equal(JSON.stringify(head.jsonLd).includes('trustScore'), false);
  assert.equal(JSON.stringify(head.jsonLd).toLowerCase().includes('verified'), false);
  assert.equal(head.jsonLd['@type'], 'HomeAndConstructionBusiness');
  assert.equal(head.jsonLd.address.addressLocality, 'Ikeja');
  assert.equal(head.jsonLd.address.addressRegion, 'Lagos');
  assert.equal(head.jsonLd.aggregateRating, undefined);
});

test('ratings are included only from real approved reviews', () => {
  const without = listingHead({
    segment: 'professionals',
    name: 'Ada Law',
    slug: 'ada-law',
    trade: 'Architect',
    reviews: { summary: { average: null, count: 0 }, reviews: [] },
  });
  assert.equal(without.jsonLd.aggregateRating, undefined);
  assert.equal(without.jsonLd['@type'], 'ProfessionalService');

  const withReviews = listingHead({
    segment: 'vendors',
    name: 'Acme Blocks',
    slug: 'acme-blocks',
    trade: 'Cement',
    city: 'Lagos',
    businessTypes: ['retailer'],
    reviews: {
      summary: { average: 4.5, count: 2 },
      reviews: [
        { rating: 5, comment: 'Delivered on the agreed day.', reviewerName: 'Chioma B.', publishedAt: '2026-10-01', title: 'Verified job' },
        { rating: 4, comment: 'Clear quote.', reviewerName: 'Bola A.', publishedAt: '2026-09-02' },
      ],
    },
  });
  assert.equal(withReviews.jsonLd['@type'], 'Store');
  assert.equal(withReviews.jsonLd.aggregateRating.reviewCount, 2);
  assert.equal(withReviews.jsonLd.review.length, 2);
  assert.equal(withReviews.jsonLd.review[0].name, undefined);
  assert.equal(withReviews.jsonLd.review[0].reviewBody, 'Delivered on the agreed day.');
});

test('placeholder routes never stay in the canonical path', () => {
  assert.equal(hasRoutePlaceholder('/artisans/[slug]'), true);
  assert.equal(hasRoutePlaceholder('/vendors/claim/[token]'), true);
  assert.equal(canonicalRouteWithoutPlaceholder('/artisans/[slug]'), '/artisans');
  assert.equal(canonicalRouteWithoutPlaceholder('/tools/price-checker/reports/[reportId]'), '/tools/price-checker/reports');
  assert.equal(canonicalRouteWithoutPlaceholder('/access/[token]'), '/access');
});

test('hub pages match city and trade without treating Nigeria as a city', () => {
  const plumbing = hubMatchForPath('/contractors/lagos/plumbing-repair');
  const nationwide = hubMatchForPath('/services/plumbing-repair-nigeria');
  const lagos = hubMatchForPath('/contractors/lagos');
  const plumber = { city: 'Ikeja', state: 'Lagos', tradeText: 'plumber plumbing burst pipes' };
  const abujaPlumber = { city: 'Dutse, Bwari, Abuja', state: 'FCT', tradeText: 'plumber' };
  const electrician = { city: 'Lekki', state: 'Lagos', tradeText: 'electrician electrical' };
  assert.equal(listingMatchesHub(plumber, plumbing), true);
  assert.equal(listingMatchesHub(abujaPlumber, plumbing), false);
  assert.equal(listingMatchesHub(electrician, plumbing), false);
  assert.equal(listingMatchesHub(abujaPlumber, nationwide), true);
  assert.equal(listingMatchesHub(abujaPlumber, hubMatchForPath('/contractors/abuja')), true);
  assert.equal(listingMatchesHub(plumber, lagos), true);
  assert.equal(hubMatchForPath('/construction/lagos'), null);
});

test('sitemap files split only after 45000 urls', () => {
  assert.deepEqual(sitemapFileNames('artisans', 592), ['sitemap-artisans.xml']);
  assert.deepEqual(sitemapFileNames('vendors', 45001), ['sitemap-vendors-1.xml', 'sitemap-vendors-2.xml']);
  assert.equal(chunkList([1, 2, 3], 2).length, 2);
  const index = buildSitemapIndex(['https://buildmyhouse.app/sitemap-static.xml']);
  assert.match(index, /<sitemapindex/);
  assert.match(index, /sitemap-static\.xml/);
  const set = buildUrlSet([{ loc: 'https://buildmyhouse.app/artisans/ada', lastmod: '2026-11-01T00:00:00.000Z' }]);
  assert.match(set, /<urlset/);
  assert.match(set, /<lastmod>2026-11-01T00:00:00.000Z<\/lastmod>/);
});
