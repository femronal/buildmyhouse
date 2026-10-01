/**
 * CloudFront viewer-request function for buildmyhouse.app
 *
 * 1) 301 legacy alias URLs to their canonical paths
 * 2) Rewrite Expo Router dynamic segments to the bracket shell HTML in S3
 *    (e.g. /tools/price-checker/reports/<uuid> → …/reports/[reportId].html)
 * 3) Rewrite other extensionless public routes to matching .html objects
 *    so crawlers receive per-route SEO (canonical/title) instead of SPA index.html
 */
function compressedSuffix(request) {
  var header = request.headers['accept-encoding'];
  var value = header && header.value ? String(header.value).toLowerCase() : '';
  if (value.indexOf('br') !== -1) return '.br';
  if (value.indexOf('gzip') !== -1) return '.gz';
  return '';
}

function isCompressibleAsset(uri) {
  return (
    uri.endsWith('.js') ||
    uri.endsWith('.css') ||
    uri.endsWith('.json') ||
    uri.endsWith('.svg')
  );
}

function handler(event) {
  var request = event.request;
  var uri = request.uri || '/';

  // Strip accidental .html from the public URL path before redirect matching
  if (uri.endsWith('.html')) {
    uri = uri.slice(0, -5);
  }
  if (uri.length > 1 && uri.endsWith('/')) {
    uri = uri.slice(0, -1);
  }

  var redirects = {
    '/login': '/',
    '/explore': '/property-projects-nigeria',
    '/rent': '/build-opportunities-nigeria',
    '/diaspora/us/build-in-nigeria': '/diaspora/build-in-nigeria-from-usa-canada',
    '/diaspora/uk/build-in-nigeria': '/diaspora/build-in-nigeria-from-uk',
    '/articles/cost-to-build-house-in-nigeria-2024':
      '/articles/cost-to-build-house-in-nigeria-2026',
    '/from-kitchen-to-building-site':
      '/blog/what-tracking-your-food-taught-me-about-building-in-nigeria',
    '/story': '/blog/what-tracking-your-food-taught-me-about-building-in-nigeria',
    '/book-repair': '/start/repair',
    '/book-repair.md': '/start.md',
    '/start-repair': '/start/repair',
  };

  var target = redirects[uri];
  if (target) {
    var host =
      request.headers.host && request.headers.host.value
        ? request.headers.host.value
        : 'buildmyhouse.app';
    var location = 'https://' + host + (target === '/' ? '/' : target);
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: { value: location },
        'cache-control': { value: 'public, max-age=86400' },
      },
    };
  }

  // Leave root and real file assets alone (.js, .css, .png, .xml, etc.)
  if (uri === '/' || uri === '') {
    request.uri = '/index.html';
    return request;
  }

  var lastSlash = uri.lastIndexOf('/');
  var lastSegment = lastSlash >= 0 ? uri.slice(lastSlash + 1) : uri;
  if (lastSegment.indexOf('.') !== -1) {
    // Hashed JS/CSS/JSON/SVG are stored precompressed. CloudFront will not
    // gzip a file larger than 10MB, so pick the encoded object here.
    var suffix = compressedSuffix(request);
    if (suffix && isCompressibleAsset(uri)) {
      request.uri = uri + suffix;
    } else {
      request.uri = uri;
    }
    return request;
  }

  // Expo exports dynamic routes as literal bracket filenames
  // (reports/[reportId].html). Map concrete ids to that shell so paid
  // report links and "Open report" stop 404ing on S3/CloudFront.
  var reportPrefix = '/tools/price-checker/reports/';
  if (uri.indexOf(reportPrefix) === 0) {
    var reportId = uri.slice(reportPrefix.length);
    if (
      reportId &&
      reportId.indexOf('/') === -1 &&
      reportId !== '[reportId]'
    ) {
      request.uri = reportPrefix + '[reportId].html';
      return request;
    }
  }

  var accessPrefix = '/access/';
  if (uri.indexOf(accessPrefix) === 0) {
    var accessToken = uri.slice(accessPrefix.length);
    if (
      accessToken &&
      accessToken.indexOf('/') === -1 &&
      accessToken !== '[token]'
    ) {
      request.uri = accessPrefix + '[token].html';
      return request;
    }
  }

  // Vendor claim invites: /vendors/claim/<token> → claim/[token].html
  var vendorClaimPrefix = '/vendors/claim/';
  if (uri.indexOf(vendorClaimPrefix) === 0) {
    var claimToken = uri.slice(vendorClaimPrefix.length);
    if (
      claimToken &&
      claimToken.indexOf('/') === -1 &&
      claimToken !== '[token]'
    ) {
      request.uri = vendorClaimPrefix + '[token].html';
      return request;
    }
  }

  // Professional claim invites: /professionals/claim/<token> → claim/[token].html
  var professionalClaimPrefix = '/professionals/claim/';
  if (uri.indexOf(professionalClaimPrefix) === 0) {
    var professionalClaimToken = uri.slice(professionalClaimPrefix.length);
    if (
      professionalClaimToken &&
      professionalClaimToken.indexOf('/') === -1 &&
      professionalClaimToken !== '[token]'
    ) {
      request.uri = professionalClaimPrefix + '[token].html';
      return request;
    }
  }

  // Professional public profiles: /professionals/<slug> → professionals/[slug].html
  var professionalsPrefix = '/professionals/';
  if (uri.indexOf(professionalsPrefix) === 0) {
    var professionalSegment = uri.slice(professionalsPrefix.length);
    var reservedProfessionalRoutes = {
      apply: true,
      manage: true,
      claim: true,
    };
    if (
      professionalSegment &&
      professionalSegment.indexOf('/') === -1 &&
      professionalSegment !== '[slug]' &&
      !reservedProfessionalRoutes[professionalSegment]
    ) {
      request.uri = professionalsPrefix + '[slug].html';
      return request;
    }
  }

  // Artisan claim invites: /artisans/claim/<token> → claim/[token].html
  var artisanClaimPrefix = '/artisans/claim/';
  if (uri.indexOf(artisanClaimPrefix) === 0) {
    var artisanClaimToken = uri.slice(artisanClaimPrefix.length);
    if (
      artisanClaimToken &&
      artisanClaimToken.indexOf('/') === -1 &&
      artisanClaimToken !== '[token]'
    ) {
      request.uri = artisanClaimPrefix + '[token].html';
      return request;
    }
  }

  // Artisan public profiles: /artisans/<slug> → artisans/[slug].html
  // New listings use this shell, so they do not need a rebuild.
  var artisansPrefix = '/artisans/';
  if (uri.indexOf(artisansPrefix) === 0) {
    var artisanSegment = uri.slice(artisansPrefix.length);
    var reservedArtisanRoutes = {
      apply: true,
      claim: true,
    };
    if (
      artisanSegment &&
      artisanSegment.indexOf('/') === -1 &&
      artisanSegment !== '[slug]' &&
      !reservedArtisanRoutes[artisanSegment]
    ) {
      request.uri = artisansPrefix + '[slug].html';
      return request;
    }
  }

  // Vendor public profiles: /vendors/<slug> → vendors/[slug].html
  // Keep static vendor routes (apply/manage/claim) on their own .html objects.
  var vendorsPrefix = '/vendors/';
  if (uri.indexOf(vendorsPrefix) === 0) {
    var vendorSegment = uri.slice(vendorsPrefix.length);
    var reservedVendorRoutes = {
      apply: true,
      manage: true,
      claim: true,
    };
    if (
      vendorSegment &&
      vendorSegment.indexOf('/') === -1 &&
      vendorSegment !== '[slug]' &&
      !reservedVendorRoutes[vendorSegment]
    ) {
      request.uri = vendorsPrefix + '[slug].html';
      return request;
    }
  }

  // Extensionless app route → S3 .html object with route-specific SEO tags
  request.uri = uri + '.html';
  return request;
}
