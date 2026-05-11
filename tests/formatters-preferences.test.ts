import { convertArea, convertCurrencyFromEur, formatArea, formatCurrency } from '../src/lib/formatters';
import { formatCostQuantity, formatUnitPrice } from '../src/lib/costs/format';

describe('preference formatters', () => {
  it('formats EUR and metric values for Spanish', () => {
    expect(formatCurrency(1234.56, 'EUR', { language: 'es' })).toContain('€');
    expect(formatArea(185, 'metric', 'es')).toContain('m²');
  });

  it('formats GBP and imperial values for English', () => {
    expect(formatCurrency(1234.56, 'GBP', { language: 'en', rate: 0.86 })).toContain('£');
    expect(formatArea(185, 'imperial', 'en')).toContain('sq ft');
    expect(Math.round(convertArea(185, 'imperial'))).toBe(1991);
    expect(convertCurrencyFromEur(100, 'GBP', 0.86)).toBe(86);
    expect(formatCostQuantity(185, 'm2', { language: 'en', measurementSystem: 'imperial' })).toContain('sq ft');
    expect(formatUnitPrice(100, 'm2', { language: 'en', currency: 'GBP', measurementSystem: 'imperial' })).toContain('/sq ft');
  });
});
