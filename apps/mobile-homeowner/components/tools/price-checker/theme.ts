/**
 * Stage 6 visual tokens — adapted from the Aura layout concept into
 * BuildMyHouse (white / charcoal / selective emerald). Not a second design
 * system; only the colours the Price Checker panels need beyond NativeWind.
 */

export const pc = {
  green: '#059669',
  greenSoft: '#ecfdf5',
  greenBorder: 'rgba(5,150,105,0.28)',
  greenGlow: 'rgba(5,150,105,0.35)',
  amber: '#b45309',
  amberSoft: '#fffbeb',
  red: '#b91c1c',
  redSoft: '#fef2f2',
  charcoal: '#1a1c23',
  charcoalDeep: '#111318',
  charcoalSoft: '#242730',
  panelBorder: 'rgba(255,255,255,0.08)',
  muted: '#94a3b8',
  white: '#ffffff',
  pageBg: '#f4f5f7',
  ink: '#171717',
} as const;

export function confidenceTone(label: string): { fg: string; bg: string; border: string } {
  switch (label) {
    case 'high':
      return { fg: pc.green, bg: pc.greenSoft, border: pc.greenBorder };
    case 'moderate':
      return { fg: pc.amber, bg: pc.amberSoft, border: 'rgba(180,83,9,0.25)' };
    case 'low':
      return { fg: '#92400e', bg: '#fff7ed', border: 'rgba(146,64,14,0.2)' };
    case 'insufficient_data':
      return { fg: pc.red, bg: pc.redSoft, border: 'rgba(185,28,28,0.2)' };
    default:
      return { fg: pc.muted, bg: '#f8fafc', border: '#e2e8f0' };
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
