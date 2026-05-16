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

  it('prefers official Callejero Codigos REST endpoint when street codes are available', async () => {
    await resolveByAddress({
      province: 'ILLES BALEARS',
      municipality: 'PALMA',
      sigla: 'CL',
      street: 'MIQUEL ROSSELLO I ALEMANY',
      number: '48',
      provinceCode: '7',
      municipalityCode: '40',
      streetCode: '1091',
    });

    const firstUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    const secondUrl = (global.fetch as jest.Mock).mock.calls[1][0] as string;
    expect(firstUrl).toContain('/COVCCallejeroCodigos.svc/rest/Consulta_DNPLOC_Codigos?');
    expect(firstUrl).toContain('CodigoProvincia=7');
    expect(firstUrl).toContain('CodigoMunicipio=40');
    expect(firstUrl).toContain('CodigoVia=1091');
    expect(firstUrl).toContain('Numero=48');
    expect(secondUrl).toContain('/COVCCallejero.svc/rest/Consulta_DNPLOC?');
  });

  it('uses official Callejero REST endpoint for cadastral reference data', async () => {
    await resolveByCadastralReference('6485534DD6768E0003QD');

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/COVCCallejero.svc/rest/Consulta_DNPRC?');
    expect(url).toContain('RefCat=6485534DD6768E0003QD');
  });

  it('uses official Coordenadas ASMX endpoint for point selection', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(EMPTY_COORD_XML),
    });

    await resolveByCoordinates(39.5696, 2.6502);

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR?');
    expect(url).toContain('SRS=EPSG%3A4326');
    expect(url).toContain('Coordenada_X=2.6502');
    expect(url).toContain('Coordenada_Y=39.5696');
  });

  it('uses the same official Coordenadas endpoint for reverse lookups', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(EMPTY_COORD_XML),
    });

    await resolveByCoordinates(40.4168, -3.7038);

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR?');
    expect(url).toContain('Coordenada_X=-3.7038');
    expect(url).toContain('Coordenada_Y=40.4168');
  });
});
