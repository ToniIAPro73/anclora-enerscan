export function formatEuroRange(min: number, max: number, mid?: number) {
  const format = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });
  if (mid && mid > min && mid < max) return `${format.format(min)} - ${format.format(max)} (ref. ${format.format(mid)})`;
  return `${format.format(min)} - ${format.format(max)}`;
}

export function formatUnitPrice(value: number, unit: string) {
  const amount = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value);
  return `${amount} EUR/${unit}`;
}
