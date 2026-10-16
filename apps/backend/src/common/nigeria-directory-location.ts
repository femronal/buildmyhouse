const FCT_VALUES = [
  'FCT',
  'fct',
  'ng-fct',
  'Abuja',
  'abuja',
  'ng-abuja',
  'Abuja / FCT',
  'Abuja (FCT)',
  'Abuja FCT',
  'Federal Capital Territory',
];

function isFct(key: string): boolean {
  return (
    key === 'fct' ||
    key === 'ng-fct' ||
    key === 'abuja' ||
    key === 'ng-abuja' ||
    key === 'abuja / fct' ||
    key === 'abuja (fct)' ||
    key === 'abuja fct' ||
    key === 'abuja-fct' ||
    key === 'federal capital territory' ||
    key === 'ng-fct-abuja'
  );
}

/** Values a directory filter should accept for one selected state. */
export function directoryLocationValues(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const key = trimmed.toLowerCase().replace(/\s+/g, ' ');
  const values = new Set<string>([trimmed]);
  if (isFct(key)) {
    FCT_VALUES.forEach((value) => values.add(value));
  }
  const bare = key.replace(/^ng-/, '').replace(/-/g, ' ');
  if (bare && bare !== key) {
    values.add(bare);
    values.add(bare.replace(/\b[a-z]/g, (char) => char.toUpperCase()));
  }
  return [...values];
}
