import { canonicalDirectoryState, directoryAreaValues, directoryLocationValues } from './nigeria-directory-location';

describe('directoryLocationValues', () => {
  it('treats Abuja and FCT keys as the same place', () => {
    for (const input of ['fct', 'ng-fct', 'Abuja', 'Abuja / FCT', 'FCT']) {
      const values = directoryLocationValues(input);
      expect(values).toEqual(expect.arrayContaining(['FCT', 'Abuja', 'Abuja / FCT', 'ng-fct']));
    }
  });

  it('keeps a normal state label alongside its ng- key', () => {
    expect(directoryLocationValues('ng-ogun')).toEqual(expect.arrayContaining(['ng-ogun', 'ogun', 'Ogun']));
    expect(directoryLocationValues('Lagos')).toEqual(expect.arrayContaining(['Lagos']));
  });

  it('reads every state key the directories already store', () => {
    expect(canonicalDirectoryState('ng-akwa-ibom')).toBe('Akwa Ibom');
    expect(canonicalDirectoryState('fct')).toBe('FCT');
    expect(canonicalDirectoryState('Abuja (FCT)')).toBe('FCT');
  });

  it('links a popular area with its LGA', () => {
    expect(directoryAreaValues('Lagos', 'Lekki')).toEqual(expect.arrayContaining(['Lekki', 'Eti-Osa']));
    expect(directoryAreaValues('ng-lagos', 'Eti-Osa')).toEqual(expect.arrayContaining(['Eti-Osa', 'Lekki', 'Ajah']));
    expect(directoryAreaValues('Ogun', 'Mowe')).toEqual(expect.arrayContaining(['Mowe', 'Obafemi Owode']));
  });
});
