import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Play, Square, Locate, Clock, Ruler, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

function BoundsController({ bounds }: { bounds: [[number, number], [number, number]] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [60, 60], animate: true });
  }, [bounds, map]);
  return null;
}

const userIcon = L.divIcon({
  html: `<div style="
    width:18px;height:18px;background:#3b82f6;border:3px solid white;
    border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3),0 2px 6px rgba(0,0,0,0.3);
    animation: pulse-blue 1.5s infinite;
  "></div>
  <style>
    @keyframes pulse-blue {
      0%,100%{box-shadow:0 0 0 4px rgba(59,130,246,0.3),0 2px 6px rgba(0,0,0,0.3);}
      50%{box-shadow:0 0 0 8px rgba(59,130,246,0.1),0 2px 6px rgba(0,0,0,0.3);}
    }
  </style>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const destIcon = L.divIcon({
  html: `<div style="
    width:30px;height:30px;background:#f97316;border:3px solid white;
    border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    box-shadow:0 3px 10px rgba(0,0,0,0.3);
  "></div>`,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

interface JourneyMapProps {
  destination: { lat: number; lng: number; name: string };
}

export function JourneyMap({ destination }: JourneyMapProps) {
  const [journeyActive, setJourneyActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const startJourney = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        setJourneyActive(true);
        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => {
            setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude });
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location permission was denied. Please allow location access in your browser and try again.");
        } else {
          setLocationError("Could not get your location. Please check your GPS and try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  const stopJourney = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setJourneyActive(false);
    setUserLocation(null);
    setLocationError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const distance = userLocation
    ? haversineKm(userLocation.lat, userLocation.lng, destination.lat, destination.lng)
    : null;
  const walkMinutes = distance !== null ? Math.round((distance / 5) * 60) : null;
  const driveMinutes = distance !== null ? Math.round((distance / 30) * 60) : null;

  const destPos: [number, number] = [destination.lat, destination.lng];
  const userPos: [number, number] | null = userLocation
    ? [userLocation.lat, userLocation.lng]
    : null;

  const bounds: [[number, number], [number, number]] | null =
    userPos ? [[Math.min(userPos[0], destPos[0]), Math.min(userPos[1], destPos[1])],
               [Math.max(userPos[0], destPos[0]), Math.max(userPos[1], destPos[1])]] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {!journeyActive ? (
          <Button
            onClick={startJourney}
            disabled={locating}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg transition-all"
          >
            {locating ? (
              <>
                <Locate className="w-4 h-4 animate-spin" />
                Getting your location...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Start Journey
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={stopJourney}
            variant="destructive"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold shadow-md"
          >
            <Square className="w-4 h-4 fill-current" />
            Stop Journey
          </Button>
        )}

        {journeyActive && userLocation && (
          <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" />
            Location active
          </div>
        )}
      </div>

      {locationError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {locationError}
        </div>
      )}

      {journeyActive && userLocation && distance !== null && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
            <Ruler className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-blue-700">
              {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
            </div>
            <div className="text-xs text-blue-500 font-medium mt-0.5">Distance</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
            <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-amber-700">{formatDuration(walkMinutes!)}</div>
            <div className="text-xs text-amber-500 font-medium mt-0.5">Walking</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
            <Clock className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-emerald-700">{formatDuration(driveMinutes!)}</div>
            <div className="text-xs text-emerald-500 font-medium mt-0.5">By Vehicle</div>
          </div>
        </div>
      )}

      <div className="h-80 md:h-96 w-full rounded-xl overflow-hidden border shadow-sm relative z-0">
        <MapContainer
          center={destPos}
          zoom={14}
          scrollWheelZoom={true}
          className="h-full w-full"
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

          <Marker position={destPos} icon={destIcon}>
            <Popup>
              <strong>{destination.name}</strong>
              <br />
              <span className="text-xs text-gray-500">Destination</span>
            </Popup>
          </Marker>

          {userPos && (
            <>
              <Marker position={userPos} icon={userIcon}>
                <Popup>
                  <strong>You are here</strong>
                  <br />
                  <span className="text-xs text-gray-500">
                    {userPos[0].toFixed(5)}, {userPos[1].toFixed(5)}
                  </span>
                </Popup>
              </Marker>
              <Polyline
                positions={[userPos, destPos]}
                color="#f97316"
                weight={3}
                dashArray="8, 8"
                opacity={0.8}
              />
              {bounds && <BoundsController bounds={bounds} />}
            </>
          )}
        </MapContainer>

        {!journeyActive && (
          <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-white/90 backdrop-blur rounded-xl px-4 py-3 shadow text-sm font-medium text-gray-700 flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" />
              Press "Start Journey" to track your route
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
