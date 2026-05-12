import { normalizeCadastralMatch, parseCadastralList, extractTagsValues } from '@/lib/catastro/normalize';

const MOCK_XML_SINGLE = `
<bico>
  <pc1>1234567</pc1>
  <pc2>AB1234C</pc2>
  <car>0001</car>
  <cc1>X</cc1>
  <cc2>A</cc2>
  <pv>MADRID</pv>
  <nm>MADRID</nm>
  <nv>CALLE MAYOR</nv>
  <pnum>1</pnum>
  <cp>28001</cp>
  <scons>120</scons>
  <ssuelo>500</ssuelo>
  <ant>1990</ant>
  <ldbi>RESIDENCIAL</ldbi>
</bico>
`;

const MOCK_PROVINCES = `
<provinciero>
  <prov><np>MADRID</np></prov>
  <prov><np>BARCELONA</np></prov>
</provinciero>
`;

describe('Catastro Normalizer', () => {
  it('should extract tag values correctly', () => {
    const values = extractTagsValues(MOCK_PROVINCES, 'np');
    expect(values).toEqual(['MADRID', 'BARCELONA']);
  });

  it('should normalize a single cadastral match from bico with full RC', () => {
    const match = normalizeCadastralMatch(MOCK_XML_SINGLE);
    expect(match.cadastralReference).toBe('1234567AB1234C0001XA');
    expect(match.parcelReference).toBe('1234567AB1234C');
    expect(match.province).toBe('MADRID');
  });
});
