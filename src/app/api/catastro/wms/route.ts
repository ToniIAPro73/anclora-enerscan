import { NextRequest, NextResponse } from 'next/server';

const CATASTRO_WMS_URL = 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx';
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1200;

function clampImageSize(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(256, Math.min(max, parsed));
}

function parseBbox(value: string | null) {
  if (!value) return null;
  const parts = value.split(',').map((part) => Number.parseFloat(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return null;

  const [west, south, east, north] = parts;
  if (west >= east || south >= north) return null;
  if (west < -180 || east > 180 || south < -90 || north > 90) return null;

  return parts;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bbox = parseBbox(searchParams.get('bbox'));

  if (!bbox) {
    return NextResponse.json({ error: 'Invalid bbox' }, { status: 400 });
  }

  const width = clampImageSize(searchParams.get('width'), 1024, MAX_WIDTH);
  const height = clampImageSize(searchParams.get('height'), 768, MAX_HEIGHT);
  const wmsParams = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetMap',
    LAYERS: 'Catastro',
    STYLES: 'Default',
    FORMAT: 'image/png',
    TRANSPARENT: 'true',
    SRS: 'EPSG:4326',
    BBOX: bbox.join(','),
    WIDTH: String(width),
    HEIGHT: String(height),
  });

  const response = await fetch(`${CATASTRO_WMS_URL}?${wmsParams.toString()}`, {
    headers: {
      Accept: 'image/png',
      'User-Agent': 'Anclora EnergyScan/1.0 (+https://anclora-energyscan.vercel.app)',
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch cadastral map layer' },
      { status: response.status }
    );
  }

  const image = await response.arrayBuffer();
  return new NextResponse(image, {
    headers: {
      'Content-Type': response.headers.get('content-type') || 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
