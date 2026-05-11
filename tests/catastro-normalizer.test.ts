import { normalizeCadastralMatch, parseCadastralList } from '@/lib/catastro/normalize';

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

const MOCK_XML_LIST = `
<rcdnp>
  <rc>
    <pc1>6485534</pc1>
    <pc2>DD6768E</pc2>
    <car>0003</car>
    <cc1>Q</cc1>
    <cc2>D</cc2>
  </rc>
  <dt>
    <np>ILLES BALEARS</np>
    <nm>PALMA</nm>
    <locs>
      <lous>
        <lourb>
          <dir>
            <tv>CL</tv>
            <nv>MIQUEL ROSSELLO I ALEMANY</nv>
            <pnp>48</pnp>
          </dir>
          <loint>
            <pt>01</pt>
            <pu>B</pu>
          </loint>
          <dp>07015</dp>
        </lourb>
      </lous>
    </locs>
  </dt>
  <bi>
    <ldbi>RESIDENCIAL</ldbi>
    <scons>67</scons>
    <ant>2003</ant>
  </bi>
</rcdnp>
`;

describe('Catastro Normalizer', () => {
  it('should normalize a single cadastral match from bico with full RC', () => {
    const match = normalizeCadastralMatch(MOCK_XML_SINGLE);
    expect(match.cadastralReference).toBe('1234567AB1234C0001XA');
    expect(match.parcelReference).toBe('1234567AB1234C');
    expect(match.province).toBe('MADRID');
    expect(match.municipality).toBe('MADRID');
    expect(match.address).toBe('CALLE MAYOR, 1');
    expect(match.propertyUse).toBe('RESIDENCIAL');
    expect(match.surfaceBuiltM2).toBe(120);
    expect(match.yearBuilt).toBe(1990);
  });

  it('should parse a list of cadastral matches with internal address', () => {
    const matches = parseCadastralList(MOCK_XML_LIST);
    expect(matches).toHaveLength(1);
    const match = matches[0];
    expect(match.cadastralReference).toBe('6485534DD6768E0003QD');
    expect(match.parcelReference).toBe('6485534DD6768E');
    expect(match.address).toBe('CL MIQUEL ROSSELLO I ALEMANY, 48');
    expect(match.floor).toBe('01');
    expect(match.door).toBe('B');
    expect(match.surfaceBuiltM2).toBe(67);
    expect(match.yearBuilt).toBe(2003);
    expect(match.propertyUse).toBe('RESIDENCIAL');
  });
});
