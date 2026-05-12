export type MapViewportTarget = {
  lat: number;
  lng: number;
  zoom: number;
};

export const REGION_COORDINATES: Record<string, MapViewportTarget> = {
  // Provinces
  "ILLES BALEARS": { lat: 39.6, lng: 2.95, zoom: 9 },
  "MADRID": { lat: 40.4168, lng: -3.7038, zoom: 10 },
  "BARCELONA": { lat: 41.3851, lng: 2.1734, zoom: 10 },
  "VALENCIA": { lat: 39.4699, lng: -0.3763, zoom: 10 },
  "SEVILLA": { lat: 37.3891, lng: -5.9845, zoom: 10 },
  "MALAGA": { lat: 36.7213, lng: -4.4214, zoom: 10 },
  "ALICANTE": { lat: 38.3452, lng: -0.4815, zoom: 10 },
  "MURCIA": { lat: 37.9922, lng: -1.1307, zoom: 10 },
  "CADIZ": { lat: 36.5271, lng: -6.2886, zoom: 10 },
  "VIZCAYA": { lat: 43.263, lng: -2.935, zoom: 10 },
  "LA CORUÑA": { lat: 43.3623, lng: -8.4115, zoom: 10 },
  "ASTURIAS": { lat: 43.3603, lng: -5.8448, zoom: 10 },
  "LAS PALMAS": { lat: 28.1235, lng: -15.4363, zoom: 10 },
  "STA. CRUZ DE TENERIFE": { lat: 28.4636, lng: -16.2518, zoom: 10 },

  // Municipalities (examples)
  "PALMA": { lat: 39.5696, lng: 2.6502, zoom: 14 },
  "CALVIA": { lat: 39.5644, lng: 2.5057, zoom: 14 },
  "LLUCMAJOR": { lat: 39.4908, lng: 2.8906, zoom: 13 },
  "MANACOR": { lat: 39.5696, lng: 3.2096, zoom: 13 },
  "INCA": { lat: 39.7214, lng: 2.9114, zoom: 14 },
  "MARRATXI": { lat: 39.6389, lng: 2.7214, zoom: 13 },
  "ALCUDIA": { lat: 39.8517, lng: 3.1214, zoom: 14 },
};

export function getCoordinatesForLocation(province?: string, municipality?: string): MapViewportTarget | null {
  if (municipality && REGION_COORDINATES[municipality.toUpperCase()]) {
    return REGION_COORDINATES[municipality.toUpperCase()];
  }
  if (province && REGION_COORDINATES[province.toUpperCase()]) {
    return REGION_COORDINATES[province.toUpperCase()];
  }
  return null;
}
