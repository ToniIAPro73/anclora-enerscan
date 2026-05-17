export type PartnerLanding = {
  slug: string;
  name: string;
  category: string;
  zone: string;
  providerId?: string;
};

export const partnerLandings: PartnerLanding[] = [
  {
    slug: 'demo-aerotermia-mallorca',
    name: 'Demo Aerotermia Mallorca',
    category: 'HVAC',
    zone: 'Mallorca',
  },
  {
    slug: 'demo-solar-baleares',
    name: 'Demo Solar Baleares',
    category: 'SOLAR',
    zone: 'Illes Balears',
  },
];

export function getPartnerLanding(slug: string) {
  return partnerLandings.find((partner) => partner.slug === slug);
}
