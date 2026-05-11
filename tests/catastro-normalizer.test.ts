import { normalizeCadastralMatch, parseCadastralList } from '@/lib/catastro/normalize';

const MOCK_XML_SINGLE = `
<bico>
  <pc1>1234567</pc1>
  <pc2>AB1234C</pc2>
  <pv>MADRID</pv>
  <nm>MADRID</nm>
  <nv>CALLE MAYOR</nv>
  <pnum>1</pnum>
  <cp>28001</cp>
  <scons>120</scons>
  <ssuelo>500</ssuelo>
  <ant>1990</ant>
</bico>
`;

const MOCK_XML_LIST = `
<rcdnp>
  <rc>1234567AB1234C0001DE</rc>
  <pv>MADRID</pv>
  <nm>MADRID</nm>
  <nv>CALLE MAYOR</nv>
  <pnum>1</pnum>
</rcdnp>
<rcdnp>
  <rc>7654321AB1234C0001DE</rc>
  <pv>BARCELONA</pv>
  <nm>BARCELONA</nm>
  <nv>AVENIDA DIAGONAL</nv>
  <pnum>100</pnum>
</rcdnp>
`;

describe('Catastro Normalizer', () => {
  it('should normalize a single cadastral match from bico', () => {
    const match = normalizeCadastralMatch(MOCK_XML_SINGLE);
    expect(match.cadastralReference).toBe('1234567AB1234C');
    expect(match.province).toBe('MADRID');
    expect(match.municipality).toBe('MADRID');
    expect(match.address).toBe('CALLE MAYOR, 1');
    expect(match.postalCode).toBe('28001');
    expect(match.surfaceBuiltM2).toBe(120);
    expect(match.yearBuilt).toBe(1990);
  });

  it('should parse a list of cadastral matches from rcdnp', () => {
    const matches = parseCadastralList(MOCK_XML_LIST);
    expect(matches).toHaveLength(2);
    expect(matches[0].cadastralReference).toBe('1234567AB1234C0001DE');
    expect(matches[0].address).toBe('CALLE MAYOR, 1');
    expect(matches[1].cadastralReference).toBe('7654321AB1234C0001DE');
    expect(matches[1].address).toBe('AVENIDA DIAGONAL, 100');
  });
});
