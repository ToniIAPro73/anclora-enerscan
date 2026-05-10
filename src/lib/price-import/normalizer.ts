import type { NormalizedImportedPriceItem, RawImportedPriceItem } from './types';

export function normalizeImportedPriceItem(raw: RawImportedPriceItem): NormalizedImportedPriceItem {
  const warnings: string[] = [];
  const unitPrice = raw.unitPrice;
  const min = raw.minUnitPrice ?? unitPrice;
  const max = raw.maxUnitPrice ?? unitPrice;

  if (!raw.sourceName.trim()) warnings.push('Missing source name.');
  if (!raw.title.trim()) warnings.push('Missing title.');
  if (!raw.unit.trim()) warnings.push('Missing unit.');
  if (min === undefined || max === undefined) warnings.push('Missing price range.');
  if (min !== undefined && max !== undefined && min > max) warnings.push('Minimum price is greater than maximum price.');

  return {
    ...raw,
    minUnitPrice: min ?? 0,
    midUnitPrice: min !== undefined && max !== undefined ? (min + max) / 2 : unitPrice,
    maxUnitPrice: max ?? min ?? 0,
    confidence: warnings.length > 0 ? 'LOW' : raw.sourceVersion || raw.capturedAt ? 'MEDIUM' : 'LOW',
    warnings,
  };
}
