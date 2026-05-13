import type { CadastralMapFeature, CadastralMatch } from './types';

const FALLBACK_FEATURE_OFFSET = 0.00016;
const MIN_FEATURE_HALF_SIDE_METERS = 8;
const MAX_FEATURE_HALF_SIDE_METERS = 30;
const FEATURE_AREA_PADDING = 1.15;

function getApproximateBounds(
  lat: number,
  lng: number,
  surfacePlotM2?: number
): [[number, number], [number, number]] {
  if (!surfacePlotM2 || surfacePlotM2 <= 0) {
    return [
      [lat - FALLBACK_FEATURE_OFFSET, lng - FALLBACK_FEATURE_OFFSET],
      [lat + FALLBACK_FEATURE_OFFSET, lng + FALLBACK_FEATURE_OFFSET],
    ];
  }

  const halfSideMeters = Math.min(
    MAX_FEATURE_HALF_SIDE_METERS,
    Math.max(MIN_FEATURE_HALF_SIDE_METERS, (Math.sqrt(surfacePlotM2) / 2) * FEATURE_AREA_PADDING)
  );
  const latOffset = halfSideMeters / 111_320;
  const lngMetersPerDegree = Math.max(1, 111_320 * Math.cos((lat * Math.PI) / 180));
  const lngOffset = halfSideMeters / lngMetersPerDegree;

  return [
    [lat - latOffset, lng - lngOffset],
    [lat + latOffset, lng + lngOffset],
  ];
}

export function mapMatchesToFeatures(matches: CadastralMatch[], selectedReference?: string): CadastralMapFeature[] {
  return matches
    .filter((match) => match.lat && match.lng)
    .map((match) => {
      const lat = match.lat!;
      const lng = match.lng!;
      const id = match.cadastralReference || match.parcelReference || `${lat},${lng}`;
      return {
        id,
        cadastralReference: match.cadastralReference,
        parcelReference: match.parcelReference,
        label: match.floor || match.door
          ? [match.floor && `Pl. ${match.floor}`, match.door && `Pt. ${match.door}`].filter(Boolean).join(' · ')
          : match.parcelReference || match.cadastralReference,
        kind: match.cadastralReference?.length === 20 ? 'unit' : 'parcel',
        center: { lat, lng },
        bounds: getApproximateBounds(lat, lng, match.surfacePlotM2),
        selected: selectedReference === match.cadastralReference || selectedReference === match.parcelReference,
        source: 'fallback',
      } satisfies CadastralMapFeature;
    });
}
