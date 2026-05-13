import { normalizeCadastralMatch, parseCadastralList, extractTagsValues, parseCoordinateList } from '@/lib/catastro/normalize';

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

const MOCK_XML_REAL = `
<bico>
  <bi>
    <idbi>
      <rc>
        <pc1>6485534</pc1>
        <pc2>DD6768E</pc2>
        <car>0003</car>
        <cc1>Q</cc1>
        <cc2>D</cc2>
      </rc>
      <ldbi>CL MIQUEL ROSSELLO I ALEMANY 48 Pl:01 Pt:B 07015 PALMA (ILLES BALEARS)</ldbi>
    </idbi>
    <dt>
      <loiv>
        <pv>ILLES BALEARS</pv>
        <nm>PALMA</nm>
      </loiv>
      <lourb>
        <dir>
          <tv>CL</tv>
          <nv>MIQUEL ROSSELLO I ALEMANY</nv>
          <pnum>48</pnum>
        </dir>
      </lourb>
    </dt>
    <lp>
      <cpt>14,570000</cpt>
    </lp>
  </bi>
  <lcons>
    <cons>
      <lcd>VIVIENDA</lcd>
      <sqyt>52</sqyt>
    </cons>
    <cons>
      <lcd>ELEMENTOS COMUNES</lcd>
      <sqyt>15</sqyt>
    </cons>
  </lcons>
  <scons>67</scons>
  <ant>2003</ant>
</bico>
`;

const MOCK_PROVINCES = `
<provinciero>
  <prov><np>MADRID</np></prov>
  <prov><np>BARCELONA</np></prov>
</provinciero>
`;

const MOCK_COORDINATE_XML = `
<consulta_coordenadas>
  <coordenadas>
    <coord>
      <pc><pc1>6485534</pc1><pc2>DD6768E</pc2></pc>
      <geo><xcen>2.6502</xcen><ycen>39.5696</ycen><srs>EPSG:4326</srs></geo>
      <ldt>CL MIQUEL ROSSELLO I ALEMANY 48 PALMA</ldt>
    </coord>
  </coordenadas>
</consulta_coordenadas>
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

  it('should correctly normalize real Catastro data with detailed construction areas', () => {
    const match = normalizeCadastralMatch(MOCK_XML_REAL);
    expect(match.cadastralReference).toBe('6485534DD6768E0003QD');
    expect(match.province).toBe('ILLES BALEARS');
    expect(match.municipality).toBe('PALMA');
    expect(match.postalCode).toBe('07015');
    expect(match.surfaceBuiltM2).toBe(67);
    expect(match.surfaceDwellingM2).toBe(52);
    expect(match.surfaceCommonM2).toBe(15);
    expect(match.yearBuilt).toBe(2003);
    expect(match.participationCoefficient).toBe(14.57);
  });

  it('should parse coordinate service responses without truncating parcel reference', () => {
    const matches = parseCoordinateList(MOCK_COORDINATE_XML);
    expect(matches).toHaveLength(1);
    expect(matches[0].cadastralReference).toBe('6485534DD6768E');
    expect(matches[0].parcelReference).toBe('6485534DD6768E');
    expect(matches[0].lat).toBe(39.5696);
    expect(matches[0].lng).toBe(2.6502);
  });
});
