import routesConfig from './seo-indexable-routes.json';

export const STATIC_INDEXABLE_ROUTES = routesConfig.exact as readonly string[];
export const INDEXABLE_ROUTE_PREFIXES = routesConfig.prefixes as readonly string[];

/** Authenticated vendor surfaces under /vendors/ that must stay noindex. */
function isPrivateVendorPath(pathname: string): boolean {
  return pathname === '/vendors/manage' || pathname.startsWith('/vendors/claim/');
}

export function isStaticIndexablePath(pathname: string): boolean {
  if (isPrivateVendorPath(pathname)) {
    return false;
  }
  if (INDEXABLE_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  return STATIC_INDEXABLE_ROUTES.includes(pathname);
}
