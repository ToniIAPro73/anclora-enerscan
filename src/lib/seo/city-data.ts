export type CitySeoData = {
  slug: string;
  name: string;
  province: string;
  region: string;
  priority: 'high' | 'medium';
};

export const citySeoData: CitySeoData[] = [
  { slug: 'palma', name: 'Palma', province: 'Illes Balears', region: 'Mallorca', priority: 'high' },
  { slug: 'calvia', name: 'Calvia', province: 'Illes Balears', region: 'Mallorca', priority: 'high' },
  { slug: 'ibiza', name: 'Ibiza', province: 'Illes Balears', region: 'Ibiza', priority: 'high' },
  { slug: 'manacor', name: 'Manacor', province: 'Illes Balears', region: 'Mallorca', priority: 'high' },
  { slug: 'mahon-mao', name: 'Mahon / Mao', province: 'Illes Balears', region: 'Menorca', priority: 'high' },
  { slug: 'madrid', name: 'Madrid', province: 'Madrid', region: 'Comunidad de Madrid', priority: 'medium' },
  { slug: 'barcelona', name: 'Barcelona', province: 'Barcelona', region: 'Catalunya', priority: 'medium' },
  { slug: 'valencia', name: 'Valencia', province: 'Valencia', region: 'Comunitat Valenciana', priority: 'medium' },
  { slug: 'malaga', name: 'Malaga', province: 'Malaga', region: 'Andalucia', priority: 'medium' },
  { slug: 'alicante', name: 'Alicante', province: 'Alicante', region: 'Comunitat Valenciana', priority: 'medium' },
  { slug: 'sevilla', name: 'Sevilla', province: 'Sevilla', region: 'Andalucia', priority: 'medium' },
];

export function getCityBySlug(slug: string) {
  return citySeoData.find((city) => city.slug === slug);
}
