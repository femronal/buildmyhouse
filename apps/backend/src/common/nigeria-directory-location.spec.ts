import { directoryLocationValues } from './nigeria-directory-location';

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
});
