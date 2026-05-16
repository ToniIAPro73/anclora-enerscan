'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import maplibregl from 'maplibre-gl';
import { Box, Layers, Loader2, MapPin, Minus, Plus } from 'lucide-react';
import type { CadastralMapFeature } from '@/lib/catastro/types';
import { usePreferences } from './AppPreferencesProvider';

interface PropertyMapProps {
  lat?: number;
  lng?: number;
  zoom?: number;
  bounds?: [[number, number], [number, number]];
  onPositionChange?: (pos: { lat: number; lng: number }) => void;
  onParcelSelect?: (lat: number, lng: number, zoom: number) => void;
  features?: CadastralMapFeature[];
  onFeatureSelect?: (feature: CadastralMapFeature) => void;
  readOnly?: boolean;
  showParcels?: boolean;
  isLoading?: boolean;
}

type MapFeatureProperties = {
  id: string;
  label: string;
  selected: boolean;
};

type MapGeoJsonFeature = {
  type: 'Feature';
  id: string;
  properties: MapFeatureProperties;
  geometry:
    | { type: 'Point'; coordinates: [number, number] }
    | { type: 'Polygon'; coordinates: [Array<[number, number]>] };
};

type MapGeoJson = {
  type: 'FeatureCollection';
  features: MapGeoJsonFeature[];
};

const SPAIN_CENTER: [number, number] = [-3.7, 40.05];
const SPAIN_ZOOM = 5.5;
const OPEN_VECTOR_STYLES = [
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  'https://tiles.openfreemap.org/styles/bright',
];
const FEATURE_SOURCE_ID = 'catastro-search-features';
const FEATURE_FILL_LAYER_ID = 'catastro-feature-fill';
const FEATURE_LINE_LAYER_ID = 'catastro-feature-line';
const FEATURE_POINT_LAYER_ID = 'catastro-feature-point';
const CATASTRO_WMS_SOURCE_ID = 'catastro-wms-viewport';
const CATASTRO_WMS_LAYER_ID = 'catastro-wms-viewport-layer';
const CATASTRO_WMS_MIN_ZOOM = 5;

function boundsToPolygon(bounds: [[number, number], [number, number]]): [Array<[number, number]>] {
  const [[south, west], [north, east]] = bounds;
  return [[
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ]];
}

function featuresToGeoJson(features: CadastralMapFeature[], fallbackLabel: string): MapGeoJson {
  const geoJsonFeatures: MapGeoJsonFeature[] = [];

  for (const feature of features) {
    const label = feature.label || feature.cadastralReference || feature.parcelReference || fallbackLabel;
    if (feature.bounds) {
      geoJsonFeatures.push({
        type: 'Feature',
        id: feature.id,
        properties: {
          id: feature.id,
          label,
          selected: Boolean(feature.selected),
        },
        geometry: {
          type: 'Polygon',
          coordinates: boundsToPolygon(feature.bounds),
        },
      });
    } else if (feature.center) {
      geoJsonFeatures.push({
        type: 'Feature',
        id: feature.id,
        properties: {
          id: feature.id,
          label,
          selected: Boolean(feature.selected),
        },
        geometry: {
          type: 'Point',
          coordinates: [feature.center.lng, feature.center.lat],
        },
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features: geoJsonFeatures,
  };
}

function addFeatureLayers(map: maplibregl.Map, data: MapGeoJson) {
  if (!map.getSource(FEATURE_SOURCE_ID)) {
    map.addSource(FEATURE_SOURCE_ID, {
      type: 'geojson',
      data,
    });
  }

  if (!map.getLayer(FEATURE_FILL_LAYER_ID)) {
    map.addLayer({
      id: FEATURE_FILL_LAYER_ID,
      type: 'fill',
      source: FEATURE_SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': '#00DC82',
        'fill-opacity': ['case', ['boolean', ['get', 'selected'], false], 0.24, 0.12],
      },
    });
  }

  if (!map.getLayer(FEATURE_LINE_LAYER_ID)) {
    map.addLayer({
      id: FEATURE_LINE_LAYER_ID,
      type: 'line',
      source: FEATURE_SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'line-color': ['case', ['boolean', ['get', 'selected'], false], '#00DC82', '#008F5A'],
        'line-width': ['case', ['boolean', ['get', 'selected'], false], 3, 2],
      },
    });
  }

  if (!map.getLayer(FEATURE_POINT_LAYER_ID)) {
    map.addLayer({
      id: FEATURE_POINT_LAYER_ID,
      type: 'circle',
      source: FEATURE_SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-color': '#00DC82',
        'circle-radius': ['case', ['boolean', ['get', 'selected'], false], 10, 7],
        'circle-stroke-color': '#005D3F',
        'circle-stroke-width': 2,
        'circle-opacity': 0.72,
      },
    });
  }
}

function buildCatastroWmsUrl(map: maplibregl.Map) {
  const bounds = map.getBounds();
  const canvas = map.getCanvas();
  const width = Math.max(256, Math.min(1600, Math.round(canvas.clientWidth)));
  const height = Math.max(256, Math.min(1200, Math.round(canvas.clientHeight)));
  const params = new URLSearchParams({
    bbox: [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ].join(','),
    width: String(width),
    height: String(height),
  });

  return `/api/catastro/wms?${params.toString()}`;
}

function getViewportCoordinates(map: maplibregl.Map): [[number, number], [number, number], [number, number], [number, number]] {
  const bounds = map.getBounds();
  const west = bounds.getWest();
  const east = bounds.getEast();
  const south = bounds.getSouth();
  const north = bounds.getNorth();
  return [
    [west, north],
    [east, north],
    [east, south],
    [west, south],
  ];
}

function removeCatastroWmsOverlay(map: maplibregl.Map) {
  if (map.getLayer(CATASTRO_WMS_LAYER_ID)) {
    map.removeLayer(CATASTRO_WMS_LAYER_ID);
  }
  if (map.getSource(CATASTRO_WMS_SOURCE_ID)) {
    map.removeSource(CATASTRO_WMS_SOURCE_ID);
  }
}

function updateCatastroWmsOverlay(map: maplibregl.Map, enabled: boolean) {
  if (!enabled || map.getZoom() < CATASTRO_WMS_MIN_ZOOM) {
    removeCatastroWmsOverlay(map);
    return;
  }

  const url = buildCatastroWmsUrl(map);
  const coordinates = getViewportCoordinates(map);
  const source = map.getSource(CATASTRO_WMS_SOURCE_ID) as maplibregl.ImageSource | undefined;

  if (source) {
    source.updateImage({ url, coordinates });
    return;
  }

  map.addSource(CATASTRO_WMS_SOURCE_ID, {
    type: 'image',
    url,
    coordinates,
  });
  map.addLayer({
    id: CATASTRO_WMS_LAYER_ID,
    type: 'raster',
    source: CATASTRO_WMS_SOURCE_ID,
    paint: {
      'raster-opacity': 0.92,
      'raster-fade-duration': 160,
    },
  });
}

function MapToolbar({
  map,
  styleIndex,
  pitchEnabled,
  onToggleStyle,
  onTogglePitch,
  labels,
}: {
  map: maplibregl.Map | null;
  styleIndex: number;
  pitchEnabled: boolean;
  onToggleStyle: () => void;
  onTogglePitch: () => void;
  labels: {
    controls: string;
    zoomIn: string;
    zoomOut: string;
    changeBaseLayer: string;
    pitchView: string;
  };
}) {
  const stopPropagation = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className="absolute right-3 top-1/2 z-[20] flex -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white text-[#111] shadow-xl ring-1 ring-black/10"
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
      onDoubleClick={stopPropagation}
      aria-label={labels.controls}
    >
      <button
        type="button"
        onClick={() => map?.zoomIn()}
        className="flex h-11 w-11 items-center justify-center border-b border-black/10 hover:bg-neutral-100"
        aria-label={labels.zoomIn}
        title={labels.zoomIn}
      >
        <Plus className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={() => map?.zoomOut()}
        className="flex h-11 w-11 items-center justify-center border-b border-black/10 hover:bg-neutral-100"
        aria-label={labels.zoomOut}
        title={labels.zoomOut}
      >
        <Minus className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={onToggleStyle}
        className={`flex h-11 w-11 items-center justify-center border-b border-black/10 hover:bg-neutral-100 ${styleIndex > 0 ? 'bg-[#00DC82]/20' : ''}`}
        aria-label={labels.changeBaseLayer}
        title={labels.changeBaseLayer}
      >
        <Layers className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onTogglePitch}
        className={`flex h-11 w-11 flex-col items-center justify-center gap-0.5 text-[11px] font-black hover:bg-neutral-100 ${pitchEnabled ? 'bg-[#00DC82]/20' : ''}`}
        aria-label={labels.pitchView}
        title={labels.pitchView}
      >
        <Box className="h-4 w-4" />
        3D
      </button>
    </div>
  );
}

export default function PropertyMap({
  lat,
  lng,
  zoom = 15,
  bounds,
  onPositionChange,
  onParcelSelect,
  features = [],
  onFeatureSelect,
  readOnly = false,
  showParcels = true,
  isLoading = false,
}: PropertyMapProps) {
  const { dictionary: t } = usePreferences();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const featureByIdRef = useRef(new Map<string, CadastralMapFeature>());
  const showParcelsRef = useRef(showParcels);
  const latestHandlersRef = useRef({
    onFeatureSelect,
    onParcelSelect,
    onPositionChange,
    readOnly,
  });
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [styleIndex, setStyleIndex] = useState(0);
  const [pitchEnabled, setPitchEnabled] = useState(false);
  const hasExplicitCenter = Number.isFinite(lat) && Number.isFinite(lng);
  const center = useMemo((): [number, number] => (
    hasExplicitCenter ? [lng!, lat!] : SPAIN_CENTER
  ), [hasExplicitCenter, lat, lng]);
  const geoJson = useMemo(() => featuresToGeoJson(showParcels ? features : [], t.wizardMapCadastralParcelLabel), [features, showParcels, t.wizardMapCadastralParcelLabel]);
  const initialCenterRef = useRef(center);
  const initialZoomRef = useRef(hasExplicitCenter ? zoom : SPAIN_ZOOM);
  const initialGeoJsonRef = useRef(geoJson);

  useEffect(() => {
    showParcelsRef.current = showParcels;
  }, [showParcels]);

  useEffect(() => {
    latestHandlersRef.current = {
      onFeatureSelect,
      onParcelSelect,
      onPositionChange,
      readOnly,
    };
  }, [onFeatureSelect, onParcelSelect, onPositionChange, readOnly]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPEN_VECTOR_STYLES[0],
      center: initialCenterRef.current,
      zoom: initialZoomRef.current,
      minZoom: 5,
      maxZoom: 19,
      pitch: 0,
      attributionControl: { compact: true },
    });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.on('load', () => {
      loadedRef.current = true;
      updateCatastroWmsOverlay(map, showParcelsRef.current);
      addFeatureLayers(map, initialGeoJsonRef.current);
    });

    map.on('moveend', () => updateCatastroWmsOverlay(map, showParcelsRef.current));

    map.on('click', (event) => {
      const renderedFeatures = map.queryRenderedFeatures(event.point, {
        layers: [FEATURE_FILL_LAYER_ID, FEATURE_LINE_LAYER_ID, FEATURE_POINT_LAYER_ID].filter((layerId) => map.getLayer(layerId)),
      });
      const selectedFeatureId = renderedFeatures[0]?.properties?.id as string | undefined;
      const selectedFeature = selectedFeatureId ? featureByIdRef.current.get(selectedFeatureId) : undefined;
      if (selectedFeature) {
        latestHandlersRef.current.onFeatureSelect?.(selectedFeature);
        return;
      }

      if (latestHandlersRef.current.readOnly) return;
      if (latestHandlersRef.current.onParcelSelect) {
        latestHandlersRef.current.onParcelSelect(event.lngLat.lat, event.lngLat.lng, map.getZoom());
      } else {
        latestHandlersRef.current.onPositionChange?.({ lat: event.lngLat.lat, lng: event.lngLat.lng });
      }
    });

    mapRef.current = map;
    setMapInstance(map);

    return () => {
      loadedRef.current = false;
      setMapInstance(null);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    featureByIdRef.current = new Map(features.map((feature) => [feature.id, feature]));
    if (!map.getSource(FEATURE_SOURCE_ID)) {
      addFeatureLayers(map, geoJson);
      return;
    }

    const source = map.getSource(FEATURE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geoJson);
    }
  }, [features, geoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    const restore = () => {
      updateCatastroWmsOverlay(map, showParcels);
      addFeatureLayers(map, geoJson);
      const source = map.getSource(FEATURE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(geoJson);
      }
    };

    map.setStyle(OPEN_VECTOR_STYLES[styleIndex]);
    map.once('styledata', restore);
  }, [geoJson, showParcels, styleIndex]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    updateCatastroWmsOverlay(map, showParcels);
  }, [showParcels]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    if (bounds) {
      const [[south, west], [north, east]] = bounds;
      map.fitBounds([[west, south], [east, north]], {
        animate: true,
        padding: 40,
        maxZoom: 18,
      });
      window.setTimeout(() => updateCatastroWmsOverlay(map, showParcelsRef.current), 900);
      return;
    }

    if (hasExplicitCenter) {
      map.easeTo({
        center,
        zoom: Math.min(zoom, 18),
        duration: 800,
      });
      window.setTimeout(() => updateCatastroWmsOverlay(map, showParcelsRef.current), 900);
    }
  }, [bounds, center, hasExplicitCenter, zoom]);

  const handleToggleStyle = () => {
    setStyleIndex((current) => (current + 1) % OPEN_VECTOR_STYLES.length);
  };

  const handleTogglePitch = () => {
    const nextPitchEnabled = !pitchEnabled;
    setPitchEnabled(nextPitchEnabled);
    mapRef.current?.easeTo({
      pitch: nextPitchEnabled ? 55 : 0,
      bearing: 0,
      duration: 500,
    });
  };

  return (
    <div className="relative h-full min-h-[300px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#d6d8d3]">
      <div ref={containerRef} className="h-full w-full" />
      <MapToolbar
        map={mapInstance}
        styleIndex={styleIndex}
        pitchEnabled={pitchEnabled}
        onToggleStyle={handleToggleStyle}
        onTogglePitch={handleTogglePitch}
        labels={{
          controls: t.wizardMapControls,
          zoomIn: t.wizardMapZoomIn,
          zoomOut: t.wizardMapZoomOut,
          changeBaseLayer: t.wizardMapChangeBaseLayer,
          pitchView: t.wizardMapPitchView,
        }}
      />

      {hasExplicitCenter && (
        <div data-map-center-marker="true" className="pointer-events-none absolute left-1/2 top-1/2 z-[25] -translate-x-1/2 -translate-y-full drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]" aria-hidden="true">
          <div className="relative h-10 w-10">
            <div className="absolute left-1/2 top-0 h-9 w-9 -translate-x-1/2 rounded-full rounded-bl-none border-[3px] border-white bg-[#1976B8] shadow-lg rotate-[-45deg]" />
            <div className="absolute left-1/2 top-[9px] h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-white shadow-inner" />
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-[30] flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-2xl border border-[#00DC82]/30 bg-[#131313]/90 p-4 shadow-2xl">
            <Loader2 className="h-5 w-5 animate-spin text-[#00DC82]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#00DC82]">{t.wizardMapLoadingCatastro}</span>
          </div>
        </div>
      )}

      {!lat && !lng && !isLoading && (
        <div className="pointer-events-none absolute left-3 top-3 z-[15] rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase text-[#111] shadow-lg">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[#00A65A]" />
            {t.wizardMapSelectLocation}
          </span>
        </div>
      )}
    </div>
  );
}
