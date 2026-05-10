import { priceSources } from './seed-data';

export function buildSourceSummary(sourceNames: string[]) {
  const uniqueNames = Array.from(new Set(sourceNames));
  const labels = uniqueNames.map((name) => {
    const source = priceSources.find((item) => item.name === name);
    return source?.versionLabel ? `${name} (${source.versionLabel}, ${source.reliability})` : name;
  });
  return labels.length > 0
    ? `Basado en catálogo interno Anclora y referencias normalizadas: ${labels.join('; ')}.`
    : 'Basado en catálogo interno Anclora y referencias de mercado normalizadas.';
}
