const LETTERS: Record<string, string> = {
  repairs: 'R',
  cleaning: 'C',
  builders: 'B',
  professional: 'P',
  materials: 'M',
};

export function formatJoinReference(path: string, serial: number): string {
  const letter = LETTERS[path] || 'X';
  return `BMH-J${letter}-${String(serial % 10000).padStart(4, '0')}`;
}

export function randomJoinSerial(): number {
  return Math.floor(Math.random() * 10000);
}
