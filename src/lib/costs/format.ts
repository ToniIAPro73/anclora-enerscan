import type { AppCurrency, AppLanguage, MeasurementSystem } from '../preferences';
import { formatCostRange, formatCurrency, formatNumber, SQFT_PER_M2 } from '../formatters';

export function formatEuroRange(
  min: number,
  max: number,
  mid?: number,
  options: { currency?: AppCurrency; language?: AppLanguage } = {}
) {
  return formatCostRange(min, max, options.currency || 'EUR', options.language || 'es', mid);
}

export function formatUnitPrice(
  value: number,
  unit: string,
  options: { currency?: AppCurrency; language?: AppLanguage; measurementSystem?: MeasurementSystem } = {}
) {
  const language = options.language || 'es';
  const measurementSystem = options.measurementSystem || 'metric';
  const shouldConvertAreaUnit = measurementSystem === 'imperial' && unit === 'm2';
  const convertedValue = shouldConvertAreaUnit ? value / SQFT_PER_M2 : value;
  const convertedUnit = shouldConvertAreaUnit ? 'sq ft' : unit;
  return `${formatCurrency(convertedValue, options.currency || 'EUR', { language, maximumFractionDigits: 0 })}/${convertedUnit}`;
}

export function formatCostQuantity(
  quantity: number,
  unit: string,
  options: { language?: AppLanguage; measurementSystem?: MeasurementSystem } = {}
) {
  const language = options.language || 'es';
  const measurementSystem = options.measurementSystem || 'metric';
  if (measurementSystem === 'imperial' && unit === 'm2') {
    return `${formatNumber(quantity * SQFT_PER_M2, language)} sq ft`;
  }
  return `${formatNumber(quantity, language)} ${unit}`;
}
