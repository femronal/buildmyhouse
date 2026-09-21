/** Nest often returns `message` as a string or an array of validation strings. */
export function httpErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'string' && err.trim()) return err.trim();
  if (!err || typeof err !== 'object') return fallback;

  const message = (err as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) return message.trim();
  if (Array.isArray(message)) {
    const parts = message
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
    if (parts.length) return parts.join(' ');
  }

  return fallback;
}
