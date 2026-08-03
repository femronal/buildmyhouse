/**
 * Removes AI citation leftovers and other invisible/junk characters that can
 * render as stray marks ("hallucinations") in published SEO copy.
 */
export function stripContentArtifacts(text: string): string {
  return text
    .replace(/\s*:contentReference\[[^\]]+\]\{[^}]+\}/g, '')
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
