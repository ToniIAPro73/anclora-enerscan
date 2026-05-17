import type { MetadataRoute } from 'next';
import { citySeoData } from '@/lib/seo/city-data';
import { partnerLandings } from '@/lib/partners/partner-landing';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://energyscan.anclora.com').replace(/\/$/, '');
  const staticRoutes = ['', '/pricing', '/wizard', '/calculadora-ahorro', '/budget-review', '/proveedores', '/profesional'];
  return [
    ...staticRoutes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() })),
    ...citySeoData.map((city) => ({ url: `${base}/ciudad/${city.slug}`, lastModified: new Date() })),
    ...partnerLandings.map((partner) => ({ url: `${base}/partner/${partner.slug}`, lastModified: new Date() })),
  ];
}
