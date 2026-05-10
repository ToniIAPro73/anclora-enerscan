import { resolveQuantity, mapPropertyType } from '../src/lib/costs/quantity-resolver';
import { PropertyDataV2 } from '../src/lib/domain/energy-assessment';

const base: PropertyDataV2 = {
  year: 1998,
  area: 185,
  zipcode: '07141',
  propertyType: 'house',
  heating: 'gas',
  cooling: 'split',
  waterHeating: 'gas',
  windows: 'double',
  renewables: 'none',
};

describe('quantity resolver', () => {
  it('calculates roof and envelope proxies for a single family property', () => {
    expect(mapPropertyType('house')).toBe('SINGLE_FAMILY');
    expect(resolveQuantity({ formula: 'roof_area_m2', propertyData: base })?.quantity).toBe(185);
    expect(resolveQuantity({ formula: 'window_area_m2', propertyData: base })?.quantity).toBe(27.75);
    expect(resolveQuantity({ formula: 'facade_area_m2', propertyData: base })?.quantity).toBe(148);
  });

  it('does not calculate a full roof for a flat without explicit data', () => {
    const flat = { ...base, area: 90, propertyType: 'flat' as const };
    const roof = resolveQuantity({ formula: 'roof_area_m2', propertyData: flat });
    expect(roof?.quantity).toBe(13.5);
    expect(roof?.confidence).toBe('LOW');
    expect(roof?.assumptions.join(' ')).toMatch(/piso/i);
  });

  it('uses local and community formulas only where appropriate', () => {
    const local = { ...base, propertyType: 'local' as never, area: 120 };
    expect(resolveQuantity({ formula: 'local_area_m2', propertyData: local })?.quantity).toBe(120);
    expect(resolveQuantity({ formula: 'local_area_m2', propertyData: base })).toBeNull();

    const community = { ...base, propertyType: 'community' as never, area: 900 };
    expect(resolveQuantity({ formula: 'community_facade_area_m2', propertyData: community })?.quantity).toBe(1080);
  });

  it('returns controlled low confidence when area is missing', () => {
    const missing = { ...base, area: 0 };
    const quantity = resolveQuantity({ formula: 'floor_area_m2', propertyData: missing });
    expect(quantity?.quantity).toBe(0);
    expect(quantity?.confidence).toBe('LOW');
  });
});
