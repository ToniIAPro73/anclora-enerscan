import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatProviderCategory, parseJsonArray } from '@/lib/domain/partners';

export const dynamic = 'force-dynamic';

const fallbackProviders = [
  {
    id: 'fallback-cee',
    name: 'Demo Certificación Energética Mediterráneo',
    categories: ['CEE', 'AUDIT'],
    zones: ['Mallorca', 'Illes Balears'],
    status: 'PREFERRED',
    verified: true,
    rating: 4.8,
    slaHours: 24,
  },
  {
    id: 'fallback-windows',
    name: 'Demo Ventanas Eficientes Levante',
    categories: ['WINDOWS'],
    zones: ['Mallorca', 'Valencia'],
    status: 'VERIFIED',
    verified: true,
    rating: 4.6,
    slaHours: 48,
  },
  {
    id: 'fallback-insulation',
    name: 'Demo Aislamientos Mediterráneos',
    categories: ['INSULATION', 'REFORM'],
    zones: ['Mallorca', 'Murcia'],
    status: 'VERIFIED',
    verified: true,
    rating: 4.7,
    slaHours: 72,
  },
  {
    id: 'fallback-solar',
    name: 'Demo Solar y Renovables Residencial',
    categories: ['SOLAR'],
    zones: ['Mallorca', 'Nacional'],
    status: 'PREFERRED',
    verified: true,
    rating: 4.5,
    slaHours: 48,
  },
];

function publicProvider(provider: {
  id: string;
  name: string;
  categories: string[] | string;
  zones: string[] | string;
  status: string;
  verified: boolean;
  rating: number;
  slaHours: number | null;
}) {
  const categories = Array.isArray(provider.categories) ? provider.categories : parseJsonArray(provider.categories);
  const zones = Array.isArray(provider.zones) ? provider.zones : parseJsonArray(provider.zones);
  return {
    id: provider.id,
    name: provider.name,
    categories,
    categoryLabels: categories.map(formatProviderCategory),
    zones,
    status: provider.status,
    verified: provider.verified,
    rating: provider.rating,
    slaHours: provider.slaHours,
  };
}

function filterProviders<T extends { categories: string[]; zones: string[]; status: string }>(
  providers: T[],
  filters: { category?: string | null; zone?: string | null; status?: string | null }
) {
  return providers.filter((provider) => {
    const categoryMatch = !filters.category || provider.categories.includes(filters.category);
    const zoneMatch = !filters.zone || provider.zones.some((zone) => zone.toLowerCase().includes(filters.zone!.toLowerCase()));
    const statusMatch = !filters.status || provider.status === filters.status;
    return categoryMatch && zoneMatch && statusMatch;
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filters = {
    category: searchParams.get('category'),
    zone: searchParams.get('zone'),
    status: searchParams.get('status'),
  };

  try {
    const rows = await prisma.provider.findMany({
      where: {
        status: filters.status || { in: ['VERIFIED', 'PREFERRED', 'EXCLUSIVE'] },
      },
      orderBy: [{ verified: 'desc' }, { rating: 'desc' }],
      take: 20,
    });
    const providers = rows.map(publicProvider);
    return NextResponse.json({ providers: filterProviders(providers, filters) });
  } catch (error) {
    console.error('Provider list failed, using fallback:', error);
    const providers = fallbackProviders.map(publicProvider);
    return NextResponse.json({ providers: filterProviders(providers, filters), fallback: true });
  }
}
