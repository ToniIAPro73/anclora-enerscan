import { getStreets } from '@/lib/catastro/client';

const MOCK_STREET_XML = `
<consulta_callejero xmlns="http://www.catastro.meh.es/">
  <control>
    <cuca>2</cuca>
  </control>
  <callejero>
    <calle>
      <loine><cp>7</cp><cm>40</cm></loine>
      <dir><cv>1091</cv><tv>CL</tv><nv>MIQUEL ROSSELLO I ALEMANY</nv></dir>
    </calle>
    <calle>
      <loine><cp>7</cp><cm>40</cm></loine>
      <dir><cv>1801</cv><tv>CL</tv><nv>MIQUEL ANGEL COLOMAR</nv></dir>
    </calle>
  </callejero>
</consulta_callejero>
`;

describe('Catastro Street Autocomplete', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should fetch and parse street suggestions', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(MOCK_STREET_XML),
    });

    const streets = await getStreets({
      province: 'ILLES BALEARS',
      municipality: 'PALMA',
      query: 'MIQUEL'
    });

    expect(streets).toHaveLength(2);
    expect(streets[0]).toEqual({
      id: '1091',
      name: 'MIQUEL ROSSELLO I ALEMANY',
      type: 'CL',
      province: 'ILLES BALEARS',
      municipality: 'PALMA'
    });
    expect(streets[1].name).toBe('MIQUEL ANGEL COLOMAR');
    const requestedUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(requestedUrl).toContain('/COVCCallejero.svc/rest/ConsultaVia?');
    expect(requestedUrl).toContain('TipoVia=');
    expect(requestedUrl).toContain('NombreVia=MIQUEL');
  });

  it('should handle fetch errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500
    });

    await expect(getStreets({
      province: 'TEST',
      municipality: 'TEST',
      query: 'TEST'
    })).rejects.toThrow('Failed to fetch streets');
  });
});
