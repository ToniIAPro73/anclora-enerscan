'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, WMSTileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

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
  readOnly?: boolean;
  showParcels?: boolean;
}

function MapUpdater({ center, zoom, bounds }: { center: [number, number], zoom: number, bounds?: [[number, number], [number, number]] }) {
  const map = useMap();
  const [lat, lng] = center;
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { animate: true, padding: [20, 20] });
    } else if (lat && lng) {
      // Use flyTo for a smoother and more professional transition
      // especially when zooming in to deep levels
      map.flyTo([lat, lng], zoom, {
        animate: true,
        duration: 1.5
      });
    }
  }, [lat, lng, zoom, map, bounds]);
  return null;
}

function LocationPicker({ onPositionChange }: { onPositionChange: (pos: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function PropertyMap({ 
  lat, 
  lng, 
  zoom = 16, 
  bounds,
  onPositionChange, 
  readOnly = false,
  showParcels = true
}: PropertyMapProps) {
  // Default to Spain (Madrid) if no coordinates
  const position: [number, number] = lat && lng ? [lat, lng] : [40.4168, -3.7038];

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-white/10 bg-black/20">
      <MapContainer 
        center={position} 
        zoom={zoom} 
        maxZoom={22}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={22}
        />
        
        {showParcels && (
          <WMSTileLayer
            url="https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx"
            layers="Catastro"
            format="image/png"
            transparent={true}
            version="1.1.1"
            opacity={0.6}
            maxZoom={22}
            attribution="&copy; Dirección General del Catastro"
          />
        )}

        {lat && lng && <Marker position={[lat, lng]} />}
        <MapUpdater center={position} zoom={zoom} bounds={bounds} />
        {!readOnly && onPositionChange && <LocationPicker onPositionChange={onPositionChange} />}
      </MapContainer>
      
      {!lat && !lng && (
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
