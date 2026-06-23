function handler(event) {
  var request = event.request;
  var uri = request.uri;

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
  };

  var target = redirects[uri];
  if (!target) {
    return request;
  }

  var host =
    request.headers.host && request.headers.host.value ? request.headers.host.value : 'buildmyhouse.app';
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
