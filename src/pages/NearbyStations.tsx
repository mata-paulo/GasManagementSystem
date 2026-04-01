import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import BottomNav from "../components/BottomNav";

mapboxgl.accessToken = "pk.eyJ1IjoibWF0YWRldnMiLCJhIjoiY21mNmdhc3YyMGcxdzJrb21xZm80c3NpbCJ9.R0nU8Ip_9RCo-Q2aWxAbXA";

const USER_TABS = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "user-history", icon: "receipt_long", label: "Scan History" },
  { id: "map", icon: "map", label: "Map" },
  { id: "settings", icon: "account_circle", label: "Account" },
];

const DEFAULT_LAT = 10.3157;
const DEFAULT_LON = 123.8854;

const FILTERS = [
  { label: "All" },
  { label: "Shell" },
  { label: "Petron" },
  { label: "Caltex" },
  { label: "Phoenix" },
  { label: "Seaoil" },
];

const BRAND_FUELS = {
  Shell: [
    { name: "Shell FuelSave Diesel", type: "Diesel" },
    { name: "Shell FuelSave Gasoline", type: "Gasoline" },
    { name: "Shell V-Power Diesel", type: "Diesel" },
    { name: "Shell V-Power Gasoline", type: "Gasoline" },
    { name: "Shell V-Power Racing", type: "Premium" },
  ],
  Petron: [
    { name: "Petron Blaze 100", type: "Premium" },
    { name: "Petron XCS", type: "Gasoline" },
    { name: "Petron Xtra Advance", type: "Gasoline" },
    { name: "Petron Diesel Max", type: "Diesel" },
    { name: "Petron Turbo Diesel", type: "Diesel" },
  ],
  Caltex: [
    { name: "Caltex Platinum with Techron", type: "Premium" },
    { name: "Caltex Gold with Techron", type: "Gasoline" },
    { name: "Caltex Regular", type: "Gasoline" },
    { name: "Caltex Power Diesel", type: "Diesel" },
    { name: "Caltex Silver Diesel", type: "Diesel" },
  ],
  Phoenix: [
    { name: "Phoenix Premium", type: "Premium" },
    { name: "Phoenix Regular", type: "Gasoline" },
    { name: "Phoenix Diesel", type: "Diesel" },
  ],
  Seaoil: [
    { name: "Seaoil FuelPlus Premium", type: "Premium" },
    { name: "Seaoil FuelPlus Gasoline", type: "Gasoline" },
    { name: "Seaoil FuelPlus Diesel", type: "Diesel" },
  ],
  default: [
    { name: "Regular Unleaded", type: "Gasoline" },
    { name: "Premium Unleaded", type: "Premium" },
    { name: "Diesel", type: "Diesel" },
  ],
};

const FUEL_TYPE_COLORS = {
  Diesel: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  Gasoline: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  Premium: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
};

function getBrandFuels(name, brand) {
  const key = [name, brand].find((v) =>
    v && Object.keys(BRAND_FUELS).some((k) => v.toLowerCase().includes(k.toLowerCase()))
  );
  if (!key) return BRAND_FUELS.default;
  const match = Object.keys(BRAND_FUELS).find((k) => key.toLowerCase().includes(k.toLowerCase()));
  return BRAND_FUELS[match] || BRAND_FUELS.default;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function formatDuration(sec) {
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function NearbyStations({ activeTab, onTabChange }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const dragStartY = useRef(null);
  const dragStartHeight = useRef(null);

  const PEEK_HEIGHT = Math.round(window.innerHeight * 0.28);
  const OPEN_HEIGHT = Math.round(window.innerHeight * 0.55);

  const [location, setLocation] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [locating, setLocating] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [drawerHeight, setDrawerHeight] = useState(PEEK_HEIGHT);
  const [isDragging, setIsDragging] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const drawerOpen = drawerHeight > PEEK_HEIGHT + 20;

  // ── Location ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported. Showing Cebu City center.");
      setLocation({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setGeoError("Could not get your location. Showing Cebu City center.");
        setLocation({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }, []);

  // ── Map init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!location || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [location.lon, location.lat],
      zoom: 14,
    });

    const el = document.createElement("div");
    el.style.cssText =
      "width:18px;height:18px;border-radius:50%;background:#003366;border:3px solid #fff;box-shadow:0 0 0 4px rgba(0,51,102,0.25)";
    new mapboxgl.Marker({ element: el })
      .setLngLat([location.lon, location.lat])
      .setPopup(new mapboxgl.Popup({ offset: 12 }).setText("You are here"))
      .addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [location]);

  // ── Fetch stations ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!location) return;
    const { lat, lon } = location;
    setLoadingStations(true);

    const query = `[out:json][timeout:25];node["amenity"="fuel"](around:5000,${lat},${lon});out body;`;
    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        const sorted = (data.elements || [])
          .map((el) => ({
            id: el.id,
            name: el.tags?.name || el.tags?.brand || "Gas Station",
            brand: el.tags?.brand || null,
            lat: el.lat,
            lon: el.lon,
            distance: getDistance(lat, lon, el.lat, el.lon),
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 10);
        setStations(sorted);
      })
      .catch(() => setStations([]))
      .finally(() => setLoadingStations(false));
  }, [location]);

  const filteredStations =
    activeFilter === "All"
      ? stations
      : stations.filter((st) =>
          (st.name + (st.brand || "")).toLowerCase().includes(activeFilter.toLowerCase())
        );

  // ── Markers ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || filteredStations.length === 0) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredStations.forEach((st, idx) => {
      const el = document.createElement("div");
      el.style.cssText = `
        width:32px;height:32px;border-radius:50%;
        background:${idx === 0 ? "#c9a227" : "#003366"};
        border:2px solid #fff;display:flex;align-items:center;
        justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.35);
        cursor:pointer;font-size:16px;
      `;
      el.innerHTML = "⛽";
      el.addEventListener("click", () => handleSelectStation(st));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([st.lon, st.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [filteredStations]);

  // ── Route drawing ───────────────────────────────────────────────────────────
  const drawRoute = async (st) => {
    if (!location) return;
    const map = mapRef.current;
    if (!map) return;

    setLoadingRoute(true);
    setRouteInfo(null);

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${location.lon},${location.lat};${st.lon},${st.lat}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
      const data = await fetch(url).then((r) => r.json());
      const route = data.routes?.[0];
      if (!route) return;

      setRouteInfo({ distance: route.distance, duration: route.duration });

      if (map.getLayer("route-outline")) map.removeLayer("route-outline");
      if (map.getLayer("route-line")) map.removeLayer("route-line");
      if (map.getSource("route")) map.removeSource("route");

      map.addSource("route", {
        type: "geojson",
        data: { type: "Feature", geometry: route.geometry },
      });
      map.addLayer({
        id: "route-outline",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#fff", "line-width": 8, "line-opacity": 0.8 },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#003366", "line-width": 5, "line-opacity": 0.95 },
      });

      const coords = route.geometry.coordinates;
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds, { padding: { top: 80, bottom: 260, left: 40, right: 40 }, duration: 900 });
    } catch {
      // silently fail
    } finally {
      setLoadingRoute(false);
    }
  };

  const clearRoute = () => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer("route-outline")) map.removeLayer("route-outline");
    if (map.getLayer("route-line")) map.removeLayer("route-line");
    if (map.getSource("route")) map.removeSource("route");
    setRouteInfo(null);
  };

  const handleSelectStation = (st) => {
    setSelectedStation(st);
    setDrawerHeight(OPEN_HEIGHT);
    drawRoute(st);
    mapRef.current?.flyTo({ center: [st.lon, st.lat], zoom: 15, duration: 800 });
  };

  // ── Drawer drag ─────────────────────────────────────────────────────────────
  const handleDragStart = (clientY) => {
    dragStartY.current = clientY;
    dragStartHeight.current = drawerHeight;
    setIsDragging(true);
  };

  const handleDragMove = (clientY) => {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - clientY;
    const newH = Math.min(Math.max(dragStartHeight.current + delta, PEEK_HEIGHT), OPEN_HEIGHT);
    setDrawerHeight(newH);
  };

  const handleDragEnd = () => {
    if (dragStartY.current === null) return;
    const mid = (PEEK_HEIGHT + OPEN_HEIGHT) / 2;
    setDrawerHeight(drawerHeight > mid ? OPEN_HEIGHT : PEEK_HEIGHT);
    dragStartY.current = null;
    setIsDragging(false);
  };

  const handleHandleClick = () => {
    if (isDragging) return;
    setDrawerHeight(drawerOpen ? PEEK_HEIGHT : OPEN_HEIGHT);
  };

  return (
    <div className="flex flex-col bg-background" style={{ height: "100dvh" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-primary-container shadow-sm shrink-0">
        <div>
          <h1 className="text-white font-headline font-bold text-lg leading-none">Nearby Stations</h1>
          <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-0.5">Gas stations within 5 km</p>
        </div>
        <span className="material-symbols-outlined text-tertiary-fixed ml-auto" style={{ fontSize: "28px", fontVariationSettings: "'FILL' 1" }}>
          local_gas_station
        </span>
      </div>

      {/* Map — fills remaining space */}
      <div className="relative flex-1">
        {locating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest z-10 gap-3">
            <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-on-surface-variant font-medium">Getting your location…</p>
          </div>
        )}

        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

        {/* Filter chips */}
        <div className="no-scrollbar absolute top-3 left-0 right-0 z-10 flex gap-2 px-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map((f) => {
            const active = activeFilter === f.label;
            return (
              <button
                key={f.label}
                onClick={() => setActiveFilter(f.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md border transition-all active:scale-95 ${
                  active ? "bg-[#003366] text-white border-[#003366]" : "bg-white text-slate-700 border-white/80"
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                  local_gas_station
                </span>
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Map controls */}
        <div className="absolute top-14 right-3 z-10 flex flex-col gap-2">
          <button onClick={() => mapRef.current?.zoomIn()} className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-slate-700 active:scale-95 transition-all border border-white/80">
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
          </button>
          <button onClick={() => mapRef.current?.zoomOut()} className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-slate-700 active:scale-95 transition-all border border-white/80">
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>remove</span>
          </button>
          <button
            onClick={() => location && mapRef.current?.flyTo({ center: [location.lon, location.lat], zoom: 14, duration: 800 })}
            className="w-9 h-9 bg-[#003366] rounded-xl shadow-md flex items-center justify-center text-white active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}>my_location</span>
          </button>
        </div>

        {geoError && (
          <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm z-10">
            {geoError}
          </div>
        )}

        {/* ── Drawer ── */}
        <div
          className="absolute left-0 right-0 bottom-0 z-30 bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            height: `${drawerHeight}px`,
            transition: isDragging ? "none" : "height 0.3s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          {/* Handle bar — draggable */}
          <div
            className="flex flex-col items-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing select-none"
            onClick={handleHandleClick}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
            onTouchMove={(e) => { e.preventDefault(); handleDragMove(e.touches[0].clientY); }}
            onTouchEnd={handleDragEnd}
            onMouseDown={(e) => {
              handleDragStart(e.clientY);
              const onMove = (ev) => handleDragMove(ev.clientY);
              const onUp = () => { handleDragEnd(); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mb-2" />
            <div className="w-full flex items-center justify-between px-4 pb-1">
              <div>
                <h2 className="text-sm font-headline font-bold text-[#003366]">Fuel Stations Nearby</h2>
                {!loadingStations && filteredStations.length > 0 && (
                  <p className="text-[10px] text-slate-400">{filteredStations.length} stations within 5 km</p>
                )}
              </div>
              <span
                className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${drawerOpen ? "rotate-180" : ""}`}
                style={{ fontSize: "22px" }}
              >
                expand_less
              </span>
            </div>
          </div>

          {/* Route info bar */}
          {(loadingRoute || routeInfo) && selectedStation && (
            <div className="mx-4 mb-2 px-4 py-2.5 bg-[#003366] rounded-xl flex items-center gap-3 shrink-0">
              <span className="material-symbols-outlined text-white" style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}>route</span>
              {loadingRoute ? (
                <p className="text-white text-xs font-medium">Calculating route…</p>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate">{selectedStation.name}</p>
                  <p className="text-white/70 text-[10px]">{formatDist(routeInfo.distance)} · {formatDuration(routeInfo.duration)} drive</p>
                </div>
              )}
              <button onClick={() => { clearRoute(); setSelectedStation(null); }} className="text-white/60 hover:text-white shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
          )}

          {/* Station list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {loadingStations && [1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
            ))}

            {!loadingStations && filteredStations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <span className="material-symbols-outlined text-gray-300" style={{ fontSize: "36px" }}>not_listed_location</span>
                <p className="text-xs text-slate-400 font-medium">No stations found within 5 km.</p>
              </div>
            )}

            {!loadingStations && filteredStations.map((st, idx) => {
              const isSelected = selectedStation?.id === st.id;
              const isExpanded = expandedId === st.id;
              const fuels = getBrandFuels(st.name, st.brand);

              return (
                <div
                  key={st.id}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    isSelected ? "border-[#003366]" : "border-slate-100"
                  }`}
                >
                  {/* Station row */}
                  <div className="flex items-center gap-3 p-3 bg-white">
                    <button
                      onClick={() => handleSelectStation(st)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg ${idx === 0 ? "bg-amber-50" : "bg-blue-50"}`}>
                        ⛽
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isSelected ? "text-[#003366]" : "text-slate-800"}`}>{st.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {formatDist(st.distance)}
                          {isSelected && routeInfo && !loadingRoute && (
                            <span> · {formatDuration(routeInfo.duration)} drive</span>
                          )}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : st.id)}
                      className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isExpanded ? "bg-[#003366] text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        style={{ fontSize: "18px" }}
                      >
                        expand_more
                      </span>
                    </button>
                  </div>

                  {/* Fuel list — expand/collapse */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Available Fuels</p>
                      {fuels.map((fuel) => {
                        const colors = FUEL_TYPE_COLORS[fuel.type] || FUEL_TYPE_COLORS.Gasoline;
                        return (
                          <div key={fuel.name} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${colors.bg}`}>
                            <div className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                            <p className={`text-xs font-semibold flex-1 ${colors.text}`}>{fuel.name}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 ${colors.text}`}>
                              {fuel.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav active={activeTab} onChange={onTabChange} tabs={USER_TABS} />
    </div>
  );
}
