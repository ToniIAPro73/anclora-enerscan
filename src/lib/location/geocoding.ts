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
  "ALMERIA": { lat: 36.834, lng: -2.4637, zoom: 10 },
  "GRANADA": { lat: 37.1773, lng: -3.5986, zoom: 10 },
  "CORDOBA": { lat: 37.8882, lng: -4.7794, zoom: 10 },
  "JAEN": { lat: 37.7796, lng: -3.7849, zoom: 10 },
  "HUELVA": { lat: 37.2614, lng: -6.9447, zoom: 10 },
  "SANTA CRUZ DE TENERIFE": { lat: 28.4636, lng: -16.2518, zoom: 10 },
  "PONTEVEDRA": { lat: 42.431, lng: -8.6444, zoom: 10 },
  "LUGO": { lat: 43.0121, lng: -7.5582, zoom: 10 },
  "ORENSE": { lat: 42.3358, lng: -7.8639, zoom: 10 },
  "GIPUZKOA": { lat: 43.3183, lng: -1.9812, zoom: 10 },
  "ALAVA": { lat: 42.8467, lng: -2.6716, zoom: 10 },
  "NAVARRA": { lat: 42.8125, lng: -1.6458, zoom: 9 },
  "ZARAGOZA": { lat: 41.6488, lng: -0.8891, zoom: 10 },
  "HUESCA": { lat: 42.1362, lng: -0.4084, zoom: 10 },
  "TERUEL": { lat: 40.3457, lng: -1.1065, zoom: 10 },
  "CANTABRIA": { lat: 43.4623, lng: -3.8099, zoom: 10 },
  "BURGOS": { lat: 42.344, lng: -3.6969, zoom: 10 },
  "LEON": { lat: 42.5987, lng: -5.5671, zoom: 10 },
  "PALENCIA": { lat: 42.01, lng: -4.52, zoom: 10 },
  "SALAMANCA": { lat: 40.9701, lng: -5.6635, zoom: 10 },
  "SEGOVIA": { lat: 40.9429, lng: -4.1088, zoom: 10 },
  "SORIA": { lat: 41.7667, lng: -2.4667, zoom: 10 },
  "VALLADOLID": { lat: 41.6523, lng: -4.7245, zoom: 10 },
  "ZAMORA": { lat: 41.5033, lng: -5.7463, zoom: 10 },
  "AVILA": { lat: 40.6567, lng: -4.7003, zoom: 10 },
  "CIUDAD REAL": { lat: 38.9863, lng: -3.9274, zoom: 10 },
  "CUENCA": { lat: 40.0704, lng: -2.1374, zoom: 10 },
  "GUADALAJARA": { lat: 40.6328, lng: -3.1653, zoom: 10 },
  "TOLEDO": { lat: 39.8628, lng: -4.0273, zoom: 10 },
  "ALBACETE": { lat: 38.9944, lng: -1.8585, zoom: 10 },
  "CASTELLON": { lat: 39.986, lng: -0.0513, zoom: 10 },
  "TARRAGONA": { lat: 41.1189, lng: 1.2445, zoom: 10 },
  "GERONA": { lat: 41.9794, lng: 2.8214, zoom: 10 },
  "LERIDA": { lat: 41.6176, lng: 0.6206, zoom: 10 },
  "LA RIOJA": { lat: 42.465, lng: -2.4456, zoom: 10 },
  "CEUTA": { lat: 35.8894, lng: -5.3198, zoom: 14 },
  "MELILLA": { lat: 35.2923, lng: -2.9381, zoom: 14 },

  // Municipalities (examples)
  "PALMA": { lat: 39.5696, lng: 2.6502, zoom: 14 },
  "PALMA DE MALLORCA": { lat: 39.5696, lng: 2.6502, zoom: 14 },
  "CALVIA": { lat: 39.5644, lng: 2.5057, zoom: 14 },
  "LLUCMAJOR": { lat: 39.4908, lng: 2.8906, zoom: 13 },
  "MANACOR": { lat: 39.5696, lng: 3.2096, zoom: 13 },
  "INCA": { lat: 39.7214, lng: 2.9114, zoom: 14 },
  "ALCUDIA": { lat: 39.8517, lng: 3.1214, zoom: 14 },
  "ANDRATX": { lat: 39.5762, lng: 2.4214, zoom: 14 },
  "ARTA": { lat: 39.6934, lng: 3.3514, zoom: 14 },
  "BINISSALEM": { lat: 39.6845, lng: 2.8414, zoom: 14 },
  "CAMPANET": { lat: 39.7734, lng: 2.9614, zoom: 14 },
  "CAMPOS": { lat: 39.4314, lng: 3.0114, zoom: 14 },
  "CAPDEPERA": { lat: 39.7014, lng: 3.4314, zoom: 14 },
  "DEIA": { lat: 39.7478, lng: 2.6483, zoom: 15 },
  "FELANITX": { lat: 39.4696, lng: 3.1486, zoom: 14 },
  "FORMENTERA": { lat: 38.7061, lng: 1.4328, zoom: 12 },
  "IBIZA": { lat: 38.9089, lng: 1.4324, zoom: 14 },
  "EIVISSA": { lat: 38.9089, lng: 1.4324, zoom: 14 },
  "LUCHMAYOR": { lat: 39.4908, lng: 2.8906, zoom: 13 },
  "LLUCMAJOR": { lat: 39.4908, lng: 2.8906, zoom: 13 },
  "MAHON": { lat: 39.888, lng: 4.2625, zoom: 14 },
  "MAO": { lat: 39.888, lng: 4.2625, zoom: 14 },
  "POLLENÇA": { lat: 39.8775, lng: 3.0163, zoom: 14 },
  "POLLENSA": { lat: 39.8775, lng: 3.0163, zoom: 14 },
  "SAN JOSE": { lat: 38.9218, lng: 1.2928, zoom: 14 },
  "SANT JOSEP DE SA TALAIA": { lat: 38.9218, lng: 1.2928, zoom: 14 },
  "SAN ANTONIO": { lat: 38.9811, lng: 1.3031, zoom: 14 },
  "SANT ANTONI DE PORTMANY": { lat: 38.9811, lng: 1.3031, zoom: 14 },
  "SANTA EULARIA DES RIU": { lat: 38.9847, lng: 1.5341, zoom: 14 },
  "SANTA EULALIA": { lat: 38.9847, lng: 1.5341, zoom: 14 },
  "SANTANYI": { lat: 39.3546, lng: 3.1294, zoom: 14 },
  "SOLLER": { lat: 39.7661, lng: 2.7152, zoom: 14 },
  "SON SERVERA": { lat: 39.6206, lng: 3.3606, zoom: 14 },
  "VALLDEMOSSA": { lat: 39.7122, lng: 2.6225, zoom: 15 },
  "CIUTADELLA DE MENORCA": { lat: 40.0017, lng: 3.8403, zoom: 14 },
  };

export function getCoordinatesForLocation(province?: string, municipality?: string): MapViewportTarget | null {
  const normProvince = province?.toUpperCase().trim();
  const normMunicipality = municipality?.toUpperCase().trim();

  if (normMunicipality && REGION_COORDINATES[normMunicipality]) {
    return REGION_COORDINATES[normMunicipality];
  }
  if (normProvince && REGION_COORDINATES[normProvince]) {
    return REGION_COORDINATES[normProvince];
  }
  return null;
}
