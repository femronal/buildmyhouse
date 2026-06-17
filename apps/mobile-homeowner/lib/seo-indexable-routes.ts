import routesConfig from './seo-indexable-routes.json';

export const STATIC_INDEXABLE_ROUTES = routesConfig.exact as readonly string[];
export const INDEXABLE_ROUTE_PREFIXES = routesConfig.prefixes as readonly string[];

export function isStaticIndexablePath(pathname: string): boolean {
  if (INDEXABLE_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  return STATIC_INDEXABLE_ROUTES.includes(pathname);
}
