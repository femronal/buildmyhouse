import { canDiscover, canDirectFetch, canBrowserFallback, policyForUrl, domainOf } from './source-registry';

describe('source-registry access decisions (per-source, not identical)', () => {
  it('Jiji: discovery + direct fetch allowed, browser fallback not', () => {
    const url = 'https://jiji.ng/lagos/some-listing';
    expect(canDiscover(url).allowed).toBe(true);
    expect(canDirectFetch(url).allowed).toBe(true);
    expect(canBrowserFallback(url).allowed).toBe(false);
  });

  it('Konga: discovery only, direct fetch NOT permitted', () => {
    const url = 'https://www.konga.com/product/abc';
    expect(canDiscover(url).allowed).toBe(true);
    expect(canDirectFetch(url).allowed).toBe(false);
  });

  it('Facebook: disabled entirely', () => {
    const url = 'https://facebook.com/marketplace/item/123';
    expect(canDiscover(url).allowed).toBe(false);
    expect(canDirectFetch(url).allowed).toBe(false);
  });

  it('unknown domain: discovery + cautious direct fetch, conservative default', () => {
    const url = 'https://randomsupplier.example/product';
    expect(canDiscover(url).allowed).toBe(true);
    expect(canDirectFetch(url).allowed).toBe(true);
  });

  it('domainOf strips www and lowercases', () => {
    expect(domainOf('https://WWW.Jiji.NG/x')).toBe('jiji.ng');
  });

  it('policy matches by domain suffix', () => {
    expect(policyForUrl('https://deals.jumia.com.ng/x').name).toMatch(/Jumia/);
  });
});
