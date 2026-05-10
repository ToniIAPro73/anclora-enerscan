import { normalizeImportedPriceItem } from '../src/lib/price-import/normalizer';

describe('price import normalizer', () => {
  it('normalizes imported ranges and surfaces warnings', () => {
    const item = normalizeImportedPriceItem({
      sourceName: 'CSV_TEST',
      title: 'Partida de prueba',
      unit: 'm2',
      minUnitPrice: 100,
      maxUnitPrice: 200,
      capturedAt: '2026-05-10',
    });
    expect(item.midUnitPrice).toBe(150);
    expect(item.confidence).toBe('MEDIUM');
    expect(item.warnings).toHaveLength(0);
  });

  it('marks incomplete imports as low confidence', () => {
    const item = normalizeImportedPriceItem({ sourceName: '', title: '', unit: '' });
    expect(item.confidence).toBe('LOW');
    expect(item.warnings.length).toBeGreaterThan(0);
  });
});
