/**
 * CloudFront viewer-request function for buildmyhouse.app
 *
 * 1) 301 legacy alias URLs to their canonical paths
 * 2) Rewrite extensionless public routes to matching .html objects in S3
 *    so crawlers receive per-route SEO (canonical/title) instead of SPA index.html
 */
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
    // Already has an extension — fetch as-is
    request.uri = uri;
    return request;
  }

  // Extensionless app route → S3 .html object with route-specific SEO tags
  request.uri = uri + '.html';
  return request;
}
