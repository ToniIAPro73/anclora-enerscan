import { getMunicipalities, getProvinces } from '@/lib/catastro/client';

describe('Catastro admin fallbacks', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns fallback provinces when Catastro rejects the province lookup', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('<error>Peticion denegada</error>'),
    });

    const provinces = await getProvinces();

    expect(provinces.length).toBeGreaterThan(40);
    expect(provinces).toContainEqual({ id: 'ILLES BALEARS', name: 'ILLES BALEARS' });
    expect(provinces).toContainEqual({ id: 'MADRID', name: 'MADRID' });
  });

  it('returns fallback municipalities when Catastro rejects the municipality lookup', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve('<error>Peticion denegada</error>'),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { municipio_id: '07040', provincia_id: '07', nombre: 'Palma' },
          { municipio_id: '07011', provincia_id: '07', nombre: 'Bunyola' },
          { municipio_id: '28079', provincia_id: '28', nombre: 'Madrid' },
        ]),
      });

    const municipalities = await getMunicipalities('ILLES BALEARS');

    expect(municipalities).toEqual([
      { id: 'BUNYOLA', name: 'BUNYOLA', provinceId: 'ILLES BALEARS' },
      { id: 'PALMA', name: 'PALMA', provinceId: 'ILLES BALEARS' },
    ]);
  });

  it('uses curated fallback municipalities when the open fallback dataset is unavailable', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve('<error>Peticion denegada</error>'),
      })
      .mockRejectedValueOnce(new Error('network unavailable'));

    const municipalities = await getMunicipalities('ILLES BALEARS');

    expect(municipalities).toContainEqual({ id: 'PALMA', name: 'PALMA', provinceId: 'ILLES BALEARS' });
  });
});
