'use client';

import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, WMSTileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2 } from 'lucide-react';

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
  readOnly?: boolean;
  showParcels?: boolean;
  isLoading?: boolean;
}

function MapUpdater({ center, zoom, bounds }: { center: [number, number], zoom: number, bounds?: [[number, number], [number, number]] }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { animate: true, padding: [40, 40], maxZoom: 18 });
    } else {
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
  }, [center[0], center[1], zoom, map, bounds]);
  return null;
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
  readOnly = false,
  showParcels = true,
  isLoading = false
}: PropertyMapProps) {
  // Default to Spain (Madrid) if no coordinates
  const position = useMemo((): [number, number] => 
    lat && lng ? [lat, lng] : [40.4168, -3.7038], 
  [lat, lng]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-white/10 bg-black/20">
      <MapContainer 
        center={position} 
        zoom={zoom} 
        maxZoom={19}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          maxNativeZoom={18}
          opacity={0.4}
        />

        <WMSTileLayer
          url="https://www.ign.es/wms-inspire/pnoa-ma"
          layers="OI.OrthoimageCoverage"
          format="image/png"
          transparent={false}
          version="1.3.0"
          attribution="&copy; Instituto Geográfico Nacional"
          maxZoom={19}
        />
        
        {showParcels && (
          <WMSTileLayer
            url="https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx"
            layers="Catastro"
            format="image/png"
            transparent={true}
            version="1.1.1"
            opacity={0.5}
            maxZoom={19}
            attribution="&copy; Dirección General del Catastro"
          />
        )}

        {lat && lng && <Marker position={[lat, lng]} />}
        <MapUpdater center={position} zoom={zoom} bounds={bounds} />
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
        <div className="absolute inset-0 z-[10] flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="bg-[#131313] border border-white/10 p-4 rounded-xl shadow-2xl flex flex-col items-center gap-2 text-center max-w-[200px]">
            <MapPin className="w-6 h-6 text-[#00DC82]" />
            <p className="text-[10px] font-bold text-premium uppercase">Selecciona ubicación en el mapa</p>
          </div>
        </div>
      )}
    </div>
  );
}
