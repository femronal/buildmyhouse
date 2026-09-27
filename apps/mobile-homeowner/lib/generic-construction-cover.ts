/** The stock construction photo that was reused across guides and tools. */
export const GENERIC_CONSTRUCTION_COVER_ID = 'photo-1504307651254-35680f356dfd';

export function isGenericConstructionCover(value?: string | null) {
  return Boolean(value && value.includes(GENERIC_CONSTRUCTION_COVER_ID));
}
