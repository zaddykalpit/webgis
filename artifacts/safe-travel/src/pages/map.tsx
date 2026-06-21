import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer, TileLayer, Marker, Polyline, Popup, useMap, useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useSearch } from "wouter";
import {
  Navigation, Locate, Layers, X, Star, Phone, MapPin, Clock, Ruler,
  ChevronRight, RotateCcw, Play, Square, AlertTriangle, ShieldAlert, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListPlaces } from "@workspace/api-client-react";
import type { Place } from "@workspace/api-client-react";

// ─── helpers ──────────────────────────────────────────────────────────────────

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

function fmt(s: number) {
  if (s < 60) return `${Math.round(s)} sec`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  return `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m`;
}

function fmtDist(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function nearestOf(places: Place[], type: string, userLat: number, userLng: number) {
  return places
    .filter(p => p.type === type)
    .sort(
      (a, b) =>
        haversineKm(userLat, userLng, a.lat, a.lng) -
        haversineKm(userLat, userLng, b.lat, b.lng)
    )[0] ?? null;
}

// ─── icons ────────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  restaurant: "#f97316",
  hotel:      "#3b82f6",
  attraction: "#22c55e",
  hospital:   "#ef4444",
  police:     "#1e3a8a",
};

function makeIcon(color: string, selected = false, pulse = false) {
  const size = selected ? 36 : 28;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};border:${selected ? "3px" : "2px"} solid white;
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      box-shadow:0 3px ${selected ? 14 : 8}px rgba(0,0,0,${selected ? 0.5 : 0.3});
      ${pulse ? `animation:pulse-ring 1.5s ease-out infinite;` : ""}
    "></div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

const userIcon = L.divIcon({
  html: `<div style="
    width:18px;height:18px;background:#3b82f6;border:3px solid white;
    border-radius:50%;box-shadow:0 0 0 6px rgba(59,130,246,0.25),0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// ─── OSRM ─────────────────────────────────────────────────────────────────────

interface OsrmStep {
  maneuver: { type: string };
  name: string;
  distance: number;
  duration: number;
}

interface RouteInfo {
  geometry: [number, number][];
  distance: number;
  duration: number;
  steps: OsrmStep[];
}

async function fetchRoute(
  from: { lat: number; lng: number },
  to:   { lat: number; lng: number }
): Promise<RouteInfo | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;
    const r = data.routes[0];
    return {
      geometry: (r.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng]),
      distance: r.distance,
      duration: r.duration,
      steps:    r.legs?.[0]?.steps ?? [],
    };
  } catch {
    return null;
  }
}

// ─── sub-components ───────────────────────────────────────────────────────────

function PanTo({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
  }, [center, zoom, map]);
  return null;
}

function FitPoints({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [80, 80], animate: true });
  }, [points, map]);
  return null;
}

function ClickDeselect({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({ click: onMapClick });
  return null;
}

// ─── constants ────────────────────────────────────────────────────────────────

const TILES = {
  standard:  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

const FILTER_TYPES = ["all", "restaurant", "hotel", "attraction", "hospital", "police"] as const;

interface SafetyRoute {
  place:    Place;
  route:    RouteInfo;
  color:    string;
  label:    string;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function MapExplorer() {
  const { data: places = [] } = useListPlaces({});

  // URL params
  const search       = useSearch();
  const isSafetyMode = new URLSearchParams(search).get("safety") === "1";

  // Map state
  const [tileStyle, setTileStyle] = useState<"standard" | "satellite">("standard");
  const [filterType, setFilterType] = useState<string>(isSafetyMode ? "all" : "all");
  const [userLoc, setUserLoc]     = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating]   = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [panTo, setPanTo]         = useState<{ center: [number, number]; zoom?: number } | null>(null);
  const [fitPoints, setFitPoints] = useState<[number, number][]>([]);

  // Single-destination navigation
  const [route, setRoute]           = useState<RouteInfo | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const watchRef = useRef<number | null>(null);

  // Safety mode — dual routes
  const [safetyRoutes, setSafetyRoutes]     = useState<SafetyRoute[]>([]);
  const [safetyLoading, setSafetyLoading]   = useState(false);
  const [safetyReady, setSafetyReady]       = useState(false);

  const filteredPlaces = filterType === "all" ? places : places.filter(p => p.type === filterType);

  // ── locate me ──────────────────────────────────────────────────────────────

  const geoLocate = useCallback((): Promise<{ lat: number; lng: number }> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        reject,
        { enableHighAccuracy: true, timeout: 12000 }
      );
    }),
  []);

  const locateMe = useCallback(async () => {
    setLocating(true);
    try {
      const loc = await geoLocate();
      setUserLoc(loc);
      setPanTo({ center: [loc.lat, loc.lng], zoom: 15 });
    } catch {}
    setLocating(false);
  }, [geoLocate]);

  // ── safety mode auto-run ───────────────────────────────────────────────────

  useEffect(() => {
    if (!isSafetyMode || places.length === 0 || safetyReady) return;

    async function runSafetyMode() {
      setSafetyLoading(true);
      try {
        const loc = await geoLocate();
        setUserLoc(loc);
        setPanTo({ center: [loc.lat, loc.lng], zoom: 14 });

        const nearestHospital = nearestOf(places, "hospital", loc.lat, loc.lng);
        const nearestPolice   = nearestOf(places, "police",   loc.lat, loc.lng);

        const targets: Array<{ place: Place; color: string; label: string }> = [];
        if (nearestHospital) targets.push({ place: nearestHospital, color: "#ef4444", label: "Nearest Hospital" });
        if (nearestPolice)   targets.push({ place: nearestPolice,   color: "#1e3a8a", label: "Nearest Police"   });

        const results: SafetyRoute[] = [];
        await Promise.all(
          targets.map(async ({ place, color, label }) => {
            const r = await fetchRoute(loc, { lat: place.lat, lng: place.lng });
            if (r) results.push({ place, route: r, color, label });
          })
        );

        setSafetyRoutes(results);
        setSafetyReady(true);

        // Fit map to user + all route geometries
        const allPts: [number, number][] = [[loc.lat, loc.lng]];
        results.forEach(sr => sr.route.geometry.forEach(p => allPts.push(p)));
        setFitPoints(allPts);
      } catch {
        setSafetyLoading(false);
      }
      setSafetyLoading(false);
    }

    runSafetyMode();
  }, [isSafetyMode, places, safetyReady, geoLocate]);

  // ── single-place navigation ────────────────────────────────────────────────

  async function startNavigation() {
    if (!selectedPlace) return;
    let loc = userLoc;
    if (!loc) {
      setLocating(true);
      try { loc = await geoLocate(); setUserLoc(loc); } catch {}
      setLocating(false);
      if (!loc) return;
    }
    setRouteLoading(true);
    const r = await fetchRoute(loc, { lat: selectedPlace.lat, lng: selectedPlace.lng });
    setRouteLoading(false);
    if (!r) return;
    setRoute(r);
    setNavigating(true);
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = navigator.geolocation.watchPosition(
      pos => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    const allPts = r.geometry;
    if (allPts.length > 0) {
      setFitPoints([[loc.lat, loc.lng], ...allPts]);
    }
  }

  function stopNavigation() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setNavigating(false);
    setRoute(null);
  }

  useEffect(() => () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  const distToSelected =
    userLoc && selectedPlace
      ? haversineKm(userLoc.lat, userLoc.lng, selectedPlace.lat, selectedPlace.lng)
      : null;

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

      {/* LEFT filter strip */}
      <div className="hidden md:flex flex-col gap-2 bg-background border-r p-3 w-44 shrink-0 overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">Filter</p>
        {FILTER_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t !== "all" && (
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TYPE_COLORS[t] }} />
            )}
            {t === "all" ? "All places" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div className="mt-auto pt-2 border-t text-xs text-muted-foreground px-1">
          {filteredPlaces.length} places shown
        </div>
      </div>

      {/* MAP */}
      <div className="relative flex-1 min-w-0">
        <MapContainer
          center={[27.7103, 85.3222]}
          zoom={13}
          className="h-full w-full"
          attributionControl={false}
          zoomControl={false}
        >
          <TileLayer url={TILES[tileStyle]} />

          {userLoc && (
            <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
              <Popup><strong>You are here</strong></Popup>
            </Marker>
          )}

          {filteredPlaces.map(place => {
            const isSafetyTarget = safetyRoutes.some(sr => sr.place.id === place.id);
            return (
              <Marker
                key={place.id}
                position={[place.lat, place.lng]}
                icon={makeIcon(
                  TYPE_COLORS[place.type] ?? "#6b7280",
                  selectedPlace?.id === place.id || isSafetyTarget,
                  isSafetyTarget
                )}
                eventHandlers={{
                  click: () => {
                    setSelectedPlace(place);
                    setPanTo({ center: [place.lat, place.lng] });
                  },
                }}
              >
                <Popup>
                  <div className="text-sm font-semibold">{place.name}</div>
                  <div className="text-xs text-gray-500">{place.type}</div>
                </Popup>
              </Marker>
            );
          })}

          {/* Safety mode — dual coloured routes */}
          {safetyRoutes.map((sr, i) => (
            <Polyline key={`safety-${i}`} positions={sr.route.geometry} color={sr.color} weight={6} opacity={0.9} dashArray={sr.label.includes("Police") ? "12 6" : undefined} />
          ))}

          {/* Single-destination route */}
          {route && safetyRoutes.length === 0 && (
            <Polyline positions={route.geometry} color="#f97316" weight={5} opacity={0.9} />
          )}

          <ClickDeselect onMapClick={() => { if (!navigating) setSelectedPlace(null); }} />
          {panTo     && <PanTo center={panTo.center} zoom={panTo.zoom} />}
          {fitPoints.length > 1 && <FitPoints points={fitPoints} />}
        </MapContainer>

        {/* MAP CONTROLS */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={locateMe}
            disabled={locating}
            className="w-10 h-10 bg-background shadow-md rounded-xl flex items-center justify-center border hover:bg-muted transition-colors"
            title="Locate me"
          >
            <Locate className={`w-5 h-5 ${locating ? "animate-spin text-primary" : ""}`} />
          </button>
          <button
            onClick={() => setTileStyle(s => s === "standard" ? "satellite" : "standard")}
            className="w-10 h-10 bg-background shadow-md rounded-xl flex items-center justify-center border hover:bg-muted transition-colors"
            title="Toggle satellite"
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile filter */}
        <div className="absolute top-4 left-4 z-[1000] md:hidden">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-background border shadow rounded-xl px-3 py-2 text-sm font-medium"
          >
            {FILTER_TYPES.map(t => (
              <option key={t} value={t}>{t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* ── SAFETY MODE PANEL ───────────────────────────── */}
        {isSafetyMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-lg px-3">
            <div className="bg-background rounded-2xl shadow-2xl border overflow-hidden">
              <div className="bg-red-600 px-4 py-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white shrink-0" />
                <span className="text-white font-bold text-sm">Emergency Safety Map</span>
                {safetyLoading && (
                  <span className="text-red-200 text-xs ml-auto animate-pulse">Locating you…</span>
                )}
              </div>

              {safetyLoading && (
                <div className="px-4 py-5 space-y-3">
                  <div className="h-10 bg-muted rounded-xl animate-pulse" />
                  <div className="h-10 bg-muted rounded-xl animate-pulse" />
                </div>
              )}

              {!safetyLoading && safetyRoutes.length === 0 && (
                <div className="px-4 py-5 text-sm text-muted-foreground text-center">
                  Allow location access to see routes to the nearest hospital &amp; police station.
                </div>
              )}

              {safetyRoutes.length > 0 && (
                <div className="divide-y">
                  {safetyRoutes.map((sr, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => { setSelectedPlace(sr.place); setPanTo({ center: [sr.place.lat, sr.place.lng] }); }}
                    >
                      <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: sr.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{sr.place.name}</div>
                        <div className="text-xs text-muted-foreground">{sr.label}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold">{fmtDist(sr.route.distance)}</div>
                        <div className="text-xs text-muted-foreground">{fmt(sr.route.duration)} drive</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 rounded-full text-xs h-8"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedPlace(sr.place);
                          setRoute(sr.route);
                          setNavigating(true);
                        }}
                      >
                        <Play className="w-3 h-3 mr-1 fill-current" />
                        Go
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* NAVIGATION BAR */}
        {navigating && route && (
          <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-background border-t shadow-2xl">
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="flex gap-4 flex-1">
                <div className="text-center">
                  <div className="text-lg font-bold">{fmtDist(route.distance)}</div>
                  <div className="text-xs text-muted-foreground">Distance</div>
                </div>
                <div className="w-px bg-border" />
                <div className="text-center">
                  <div className="text-lg font-bold">{fmt(route.duration)}</div>
                  <div className="text-xs text-muted-foreground">Drive time</div>
                </div>
                {selectedPlace && (
                  <>
                    <div className="w-px bg-border" />
                    <div className="text-center min-w-0">
                      <div className="text-sm font-semibold truncate">{selectedPlace.name}</div>
                      <div className="text-xs text-muted-foreground">Destination</div>
                    </div>
                  </>
                )}
              </div>
              <Button variant="destructive" size="sm" onClick={stopNavigation} className="flex items-center gap-1.5 rounded-full px-4">
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT place info panel */}
      {selectedPlace && (
        <div className="w-80 shrink-0 bg-background border-l flex flex-col overflow-y-auto animate-in slide-in-from-right">
          <div className="relative h-48 bg-muted shrink-0">
            {selectedPlace.photo_url ? (
              <img src={selectedPlace.photo_url} alt={selectedPlace.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-10 h-10 opacity-20" />
              </div>
            )}
            <button
              onClick={() => { setSelectedPlace(null); if (!isSafetyMode) { setRoute(null); setNavigating(false); } }}
              className="absolute top-2 right-2 w-8 h-8 bg-black/40 backdrop-blur text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2">
              <Badge className="text-white border-0 text-xs font-semibold" style={{ background: TYPE_COLORS[selectedPlace.type] ?? "#6b7280" }}>
                {selectedPlace.type}
              </Badge>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3 flex-1">
            <div>
              <h2 className="text-lg font-bold leading-tight">{selectedPlace.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">{selectedPlace.rating.toFixed(1)}</span>
                <span>({selectedPlace.rating_count} reviews)</span>
                <span className="ml-auto font-medium text-foreground">
                  {Array(selectedPlace.price_level).fill("$").join("")}
                </span>
              </div>
            </div>

            {distToSelected !== null && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                <Ruler className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-blue-700">
                    {distToSelected < 1
                      ? `${Math.round(distToSelected * 1000)} m away`
                      : `${distToSelected.toFixed(1)} km away`}
                  </div>
                  <div className="text-xs text-blue-500">
                    ~{Math.round((distToSelected / 5) * 60)} min walk &middot;
                    ~{Math.round((distToSelected / 30) * 60)} min drive
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{selectedPlace.address}</span>
            </div>

            {selectedPlace.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{selectedPlace.phone}</span>
              </div>
            )}

            {selectedPlace.description && (
              <p className="text-sm text-muted-foreground leading-relaxed border-t pt-3">
                {selectedPlace.description}
              </p>
            )}

            {!navigating ? (
              <Button
                className="mt-auto w-full flex items-center gap-2 rounded-full"
                onClick={startNavigation}
                disabled={routeLoading}
              >
                {routeLoading ? (
                  <><RotateCcw className="w-4 h-4 animate-spin" /> Calculating route…</>
                ) : (
                  <><Play className="w-4 h-4 fill-current" /> Navigate Here</>
                )}
              </Button>
            ) : (
              <Button variant="destructive" className="mt-auto w-full flex items-center gap-2 rounded-full" onClick={stopNavigation}>
                <Square className="w-4 h-4 fill-current" />
                Stop Navigation
              </Button>
            )}

            {route && route.steps.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Directions</p>
                <div className="space-y-2">
                  {route.steps.slice(0, 12).map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                      <div className="flex-1">
                        <span className="text-foreground">
                          {step.name ? `Turn onto ${step.name}` : step.maneuver.type.replace(/-/g, " ")}
                        </span>
                        <span className="text-muted-foreground ml-1">({fmtDist(step.distance)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <a href={`/places/${selectedPlace.id}`} className="text-center text-xs text-primary hover:underline mt-1">
              View full details &amp; reviews
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
