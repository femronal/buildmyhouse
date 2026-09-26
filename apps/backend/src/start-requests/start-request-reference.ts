const LETTERS: Record<string, string> = {
  repair: 'R',
  upgrade: 'U',
  build: 'B',
  interiors: 'I',
};

export function formatStartReference(path: string, serial: number): string {
  const letter = LETTERS[path] || 'X';
  const digits = String(serial % 10000).padStart(4, '0');
  return `BMH-${letter}-${digits}`;
}

export function randomStartSerial(): number {
  return Math.floor(Math.random() * 10000);
}
