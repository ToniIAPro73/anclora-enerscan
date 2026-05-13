'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Popup, Rectangle, TileLayer, useMap, useMapEvents, WMSTileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Layers, Loader2, MapPin, Minus, Plus } from 'lucide-react';
import type { CadastralMapFeature } from '@/lib/catastro/types';

// Fix for default marker icon in Leaflet + Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PropertyMapProps {
  lat?: number;
  lng?: number;
  zoom?: number;
  bounds?: [[number, number], [number, number]];
  onPositionChange?: (pos: { lat: number; lng: number }) => void;
  onParcelSelect?: (lat: number, lng: number) => void;
  features?: CadastralMapFeature[];
  onFeatureSelect?: (feature: CadastralMapFeature) => void;
  readOnly?: boolean;
  showParcels?: boolean;
  isLoading?: boolean;
}

const SPAIN_CENTER: [number, number] = [40.05, -3.7];
const SPAIN_ZOOM = 6;

function MapUpdater({ center, zoom, bounds, hasExplicitCenter }: { center: [number, number], zoom: number, bounds?: [[number, number], [number, number]], hasExplicitCenter: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { animate: true, padding: [40, 40], maxZoom: 18 });
    } else if (hasExplicitCenter) {
      const [lat, lng] = center;
      if (lat && lng) {
        // Use setView instead of flyTo for reliability if flyTo is glitching
        // or a very short flyTo
        map.flyTo([lat, lng], Math.min(zoom, 18), {
          animate: true,
          duration: 1.0
        });
      }
    }
  }, [center, zoom, map, bounds, hasExplicitCenter]);
  return null;
}

function MapToolbar({
  satellite,
  onToggleSatellite,
}: {
  satellite: boolean;
  onToggleSatellite: () => void;
}) {
  const map = useMap();

  const stopPropagation = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className="absolute right-3 top-1/2 z-[600] flex -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white text-[#111] shadow-xl ring-1 ring-black/10"
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
      onDoubleClick={stopPropagation}
      aria-label="Controles del mapa"
    >
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="flex h-11 w-11 items-center justify-center border-b border-black/10 hover:bg-neutral-100"
        aria-label="Acercar mapa"
        title="Acercar"
      >
        <Plus className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="flex h-11 w-11 items-center justify-center border-b border-black/10 hover:bg-neutral-100"
        aria-label="Alejar mapa"
        title="Alejar"
      >
        <Minus className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={onToggleSatellite}
        className={`flex h-11 w-11 items-center justify-center border-b border-black/10 hover:bg-neutral-100 ${satellite ? 'bg-[#00DC82]/20' : ''}`}
        aria-label="Cambiar capa base"
        title="Cambiar capa"
      >
        <Layers className="h-5 w-5" />
      </button>
      <button
        type="button"
        className="flex h-11 w-11 flex-col items-center justify-center gap-0.5 text-[11px] font-black hover:bg-neutral-100"
        aria-label="Vista 3D orientativa"
        title="Vista 3D"
      >
        <Box className="h-4 w-4" />
        3D
      </button>
    </div>
  );
}

function LocationPicker({ onPositionChange, onParcelSelect }: { 
  onPositionChange: (pos: { lat: number; lng: number }) => void,
  onParcelSelect?: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (onParcelSelect) {
        onParcelSelect(e.latlng.lat, e.latlng.lng);
      } else {
        onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
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
  isLoading = false
}: PropertyMapProps) {
  const [satellite, setSatellite] = useState(false);
  const hasExplicitCenter = Boolean(lat && lng);
  const position = useMemo((): [number, number] => 
    hasExplicitCenter ? [lat!, lng!] : SPAIN_CENTER, 
  [hasExplicitCenter, lat, lng]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-white/10 bg-black/20">
      <MapContainer 
        center={position} 
        zoom={hasExplicitCenter ? zoom : SPAIN_ZOOM}
        minZoom={5}
        maxZoom={19}
        zoomControl={false}
        scrollWheelZoom
        dragging
        touchZoom
        doubleClickZoom
        keyboard
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        {satellite ? (
          <WMSTileLayer
            url="https://www.ign.es/wms-inspire/pnoa-ma"
            layers="OI.OrthoimageCoverage"
            format="image/png"
            transparent={false}
            version="1.3.0"
            attribution="&copy; Instituto Geográfico Nacional"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            maxNativeZoom={18}
          />
        )}
        
        {showParcels && (
          <WMSTileLayer
            url="https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx"
            layers="Catastro"
            format="image/png"
            transparent={true}
            version="1.1.1"
            opacity={1}
            maxZoom={19}
            attribution="&copy; Dirección General del Catastro"
          />
        )}

        {features.map((feature) => (
          feature.bounds ? (
            <Rectangle
              key={feature.id}
              bounds={feature.bounds}
              pathOptions={{
                color: feature.selected ? '#00DC82' : '#008F5A',
                weight: feature.selected ? 3 : 2,
                fillColor: '#00DC82',
                fillOpacity: feature.selected ? 0.22 : 0.12,
              }}
              eventHandlers={{
                click: () => onFeatureSelect?.(feature),
              }}
            >
              <Popup>
                <span>{feature.label || feature.cadastralReference || feature.parcelReference || 'Finca catastral'}</span>
              </Popup>
            </Rectangle>
          ) : feature.center ? (
            <CircleMarker
              key={feature.id}
              center={[feature.center.lat, feature.center.lng]}
              radius={feature.selected ? 10 : 7}
              pathOptions={{
                color: feature.selected ? '#00DC82' : '#008F5A',
                fillColor: '#00DC82',
                fillOpacity: 0.35,
              }}
              eventHandlers={{
                click: () => onFeatureSelect?.(feature),
              }}
            >
              <Popup>
                <span>{feature.label || feature.cadastralReference || feature.parcelReference || 'Finca catastral'}</span>
              </Popup>
            </CircleMarker>
          ) : null
        ))}

        {lat && lng && <Marker position={[lat, lng]} />}
        <MapUpdater center={position} zoom={zoom} bounds={bounds} hasExplicitCenter={hasExplicitCenter} />
        <MapToolbar satellite={satellite} onToggleSatellite={() => setSatellite((current) => !current)} />
        {!readOnly && onPositionChange && (
          <LocationPicker onPositionChange={onPositionChange} onParcelSelect={onParcelSelect} />
        )}
      </MapContainer>
      
      {isLoading && (
        <div className="absolute inset-0 z-[10] flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
          <div className="bg-[#131313]/90 border border-[#00DC82]/30 p-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#00DC82] animate-spin" />
            <span className="text-xs font-bold text-[#00DC82] uppercase tracking-wider">Consultando Catastro...</span>
          </div>
        </div>
      )}

      {!lat && !lng && !isLoading && (
        <div className="pointer-events-none absolute left-3 top-3 z-[10] rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase text-[#111] shadow-lg">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[#00A65A]" />
            Selecciona ubicación en el mapa
          </span>
        </div>
      )}
    </div>
  );
}
