import { dictionaries, getLegalDisclaimer } from '../src/lib/i18n';

describe('i18n dictionaries', () => {
  it('keeps main dictionaries aligned across public languages', () => {
    const esKeys = Object.keys(dictionaries.es).sort();
    expect(Object.keys(dictionaries.en).sort()).toEqual(esKeys);
    expect(Object.keys(dictionaries.de).sort()).toEqual(esKeys);
  });

  it('keeps the official CEE disclaimer explicit in every language', () => {
    expect(getLegalDisclaimer('es')).toContain('Certificado de Eficiencia Energética oficial');
    expect(getLegalDisclaimer('en')).toContain('official Energy Performance Certificate');
    expect(getLegalDisclaimer('de')).toContain('offiziellen Energieausweis');
  });
});
