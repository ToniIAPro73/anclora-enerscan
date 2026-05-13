import type { CadastralMapFeature, CadastralMatch } from './types';

const APPROXIMATE_FEATURE_OFFSET = 0.00035;

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
        bounds: [
          [lat - APPROXIMATE_FEATURE_OFFSET, lng - APPROXIMATE_FEATURE_OFFSET],
          [lat + APPROXIMATE_FEATURE_OFFSET, lng + APPROXIMATE_FEATURE_OFFSET],
        ],
        selected: selectedReference === match.cadastralReference || selectedReference === match.parcelReference,
        source: 'fallback',
      } satisfies CadastralMapFeature;
    });
}
