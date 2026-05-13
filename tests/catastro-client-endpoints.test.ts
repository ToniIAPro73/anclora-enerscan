import { resolveByAddress, resolveByCadastralReference, resolveByCoordinates } from '@/lib/catastro/client';

const EMPTY_DNP_XML = '<consulta_dnp><control><cudnp>0</cudnp></control></consulta_dnp>';
const EMPTY_COORD_XML = '<consulta_coordenadas><control><cucoor>0</cucoor></control></consulta_coordenadas>';

describe('Catastro client endpoints', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(EMPTY_DNP_XML),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('uses official Callejero REST endpoint and address parameters for address lookup', async () => {
    await resolveByAddress({
      province: 'ILLES BALEARS',
      municipality: 'PALMA',
      sigla: 'CL',
      street: 'MIQUEL ROSSELLO I ALEMANY',
      number: '48',
    });

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/COVCCallejero.svc/rest/Consulta_DNPLOC?');
    expect(url).toContain('TipoVia=CL');
    expect(url).toContain('NomVia=MIQUEL+ROSSELLO+I+ALEMANY');
    expect(url).toContain('Numero=48');
  });

  it('uses official Callejero REST endpoint for cadastral reference data', async () => {
    await resolveByCadastralReference('6485534DD6768E0003QD');

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/COVCCallejero.svc/rest/Consulta_DNPRC?');
    expect(url).toContain('RefCat=6485534DD6768E0003QD');
  });

  it('uses official Coordenadas REST endpoint for point selection', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(EMPTY_COORD_XML),
    });

    await resolveByCoordinates(39.5696, 2.6502);

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/COVCCoordenadas.svc/rest/Consulta_RCCOOR?');
    expect(url).toContain('SRS=EPSG%3A4326');
    expect(url).toContain('Coordenada_X=2.6502');
    expect(url).toContain('Coordenada_Y=39.5696');
  });
});
