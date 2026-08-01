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

/** Type + spacing scale for thin phones vs desktop conversation chrome. */
export type PriceCheckerDensity = {
  compact: boolean;
  /** Extra-tight for ≤360px widths. */
  narrow: boolean;
  panelPad: number;
  panelRadius: number;
  titleSize: number;
  titleLineHeight: number;
  bodySize: number;
  bodyLineHeight: number;
  labelSize: number;
  buttonTextSize: number;
  buttonMinHeight: number;
  timerDigitSize: number;
  progressMb: number;
};

export function getPriceCheckerDensity(width: number): PriceCheckerDensity {
  const compact = width < 900;
  const narrow = width <= 360;
  return {
    compact,
    narrow,
    panelPad: narrow ? 12 : compact ? 14 : 28,
    panelRadius: compact ? 18 : 32,
    titleSize: narrow ? 18 : compact ? 20 : 24,
    titleLineHeight: narrow ? 24 : compact ? 26 : 32,
    bodySize: compact ? 13 : 14,
    bodyLineHeight: compact ? 18 : 22,
    labelSize: compact ? 10 : 12,
    buttonTextSize: compact ? 14 : 16,
    buttonMinHeight: compact ? 44 : 48,
    timerDigitSize: compact ? 28 : 48,
    progressMb: compact ? 12 : 24,
  };
}

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
