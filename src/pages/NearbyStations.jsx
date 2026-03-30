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

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyStations({ activeTab, onTabChange }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const [location, setLocation] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [locating, setLocating] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");

  const FILTERS = [
    { label: "All", icon: "local_gas_station" },
    { label: "Shell", icon: "local_gas_station" },
    { label: "Petron", icon: "local_gas_station" },
    { label: "Caltex", icon: "local_gas_station" },
    { label: "Phoenix", icon: "local_gas_station" },
    { label: "Seaoil", icon: "local_gas_station" },
  ];

  // Get user location
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

  // Init map once location is known
  useEffect(() => {
    if (!location || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [location.lon, location.lat],
      zoom: 14,
    });

    // Navigation control handled via custom buttons

    // User location pulse marker
    const el = document.createElement("div");
    el.style.cssText =
      "width:18px;height:18px;border-radius:50%;background:#003366;border:3px solid #fff;box-shadow:0 0 0 4px rgba(0,51,102,0.25)";
    new mapboxgl.Marker({ element: el })
      .setLngLat([location.lon, location.lat])
      .setPopup(new mapboxgl.Popup({ offset: 12 }).setText("You are here"))
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [location]);

  // Fetch gas stations via Overpass
  useEffect(() => {
    if (!location) return;
    const { lat, lon } = location;
    setLoadingStations(true);

    const query = `[out:json][timeout:25];node["amenity"="fuel"](around:5000,${lat},${lon});out body;`;
    fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
    )
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
          (st.name + (st.brand || ""))
            .toLowerCase()
            .includes(activeFilter.toLowerCase())
        );

  // Add station markers — re-runs when filter changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || filteredStations.length === 0) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredStations.forEach((st, idx) => {
      const el = document.createElement("div");
      el.style.cssText = `
        width:32px;height:32px;border-radius:50%;
        background:${idx === 0 ? "#c9a227" : "#003366"};
        border:2px solid #fff;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
        cursor:pointer;font-size:16px;
      `;
      el.innerHTML = "⛽";

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([st.lon, st.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 16 }).setHTML(
            `<strong style="font-size:13px">${st.name}</strong><br/>
             <span style="color:#555;font-size:11px">${(st.distance < 1000 ? Math.round(st.distance) + " m" : (st.distance / 1000).toFixed(1) + " km")} away</span>`
          )
        )
        .addTo(map);

      el.addEventListener("click", () => setSelectedId(st.id));
      markersRef.current.push(marker);
    });
  }, [filteredStations]);

  const flyTo = (st) => {
    setSelectedId(st.id);
    mapRef.current?.flyTo({ center: [st.lon, st.lat], zoom: 16, duration: 800 });
  };

  const formatDist = (m) =>
    m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;

  return (
    <div className="flex flex-col bg-background" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-primary-container shadow-sm shrink-0">
        <div>
          <h1 className="text-white font-headline font-bold text-lg leading-none">
            Nearby Stations
          </h1>
          <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-0.5">
            Gas stations within 5 km
          </p>
        </div>
        <span
          className="material-symbols-outlined text-tertiary-fixed ml-auto"
          style={{ fontSize: "28px", fontVariationSettings: "'FILL' 1" }}
        >
          local_gas_station
        </span>
      </div>

      {/* Map — 70% */}
      <div className="relative shrink-0" style={{ height: "calc((100dvh - 64px - 88px) * 0.7)" }}>
        {locating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest z-10 gap-3">
            <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-on-surface-variant font-medium">
              Getting your location…
            </p>
          </div>
        )}
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

        {/* Filter chips */}
        <div className="no-scrollbar absolute top-3 left-0 right-0 z-10 flex gap-2 px-3 overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {FILTERS.map((f) => {
            const active = activeFilter === f.label;
            return (
              <button
                key={f.label}
                onClick={() => setActiveFilter(f.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md border transition-all active:scale-95 ${
                  active
                    ? "bg-[#003366] text-white border-[#003366]"
                    : "bg-white text-slate-700 border-white/80"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "14px", fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {f.icon}
                </span>
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Map controls — below filter chips */}
        <div className="absolute top-14 right-3 z-10 flex flex-col gap-2">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-slate-700 active:scale-95 transition-all border border-white/80"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-slate-700 active:scale-95 transition-all border border-white/80"
          >
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
      </div>

      {/* Station list — 30% */}
      <div
        className="overflow-y-auto bg-background shrink-0"
        style={{ height: "calc((100dvh - 64px - 88px) * 0.3)" }}
      >
        <div className="px-4 pt-3 pb-2 flex items-center justify-between sticky top-0 bg-background z-10">
          <h2 className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
            Fuel Stations Nearby
          </h2>
          {!loadingStations && filteredStations.length > 0 && (
            <span className="text-xs font-bold text-primary-container">
              {filteredStations.length} found
            </span>
          )}
        </div>

        <div className="px-4 pb-3 space-y-2">
          {loadingStations &&
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-surface-container-low animate-pulse"
              />
            ))}

          {!loadingStations && filteredStations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
              <span
                className="material-symbols-outlined text-outline"
                style={{ fontSize: "36px" }}
              >
                not_listed_location
              </span>
              <p className="text-xs text-on-surface-variant font-medium">
                No stations found within 5 km.
              </p>
            </div>
          )}

          {!loadingStations &&
            filteredStations.map((st, idx) => (
              <button
                key={st.id}
                onClick={() => flyTo(st)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  selectedId === st.id
                    ? "border-primary-container bg-primary-container/10"
                    : "border-outline-variant/20 bg-surface-container-lowest"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base ${
                    idx === 0
                      ? "bg-tertiary/20 text-tertiary"
                      : "bg-primary-container/10 text-primary-container"
                  }`}
                >
                  ⛽
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">
                    {st.name}
                  </p>
                  {st.brand && st.brand !== st.name && (
                    <p className="text-[10px] text-on-surface-variant truncate">
                      {st.brand}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-black shrink-0 ${
                    idx === 0 ? "text-tertiary" : "text-primary-container"
                  }`}
                >
                  {formatDist(st.distance)}
                </span>
              </button>
            ))}
        </div>
      </div>

      <BottomNav active={activeTab} onChange={onTabChange} tabs={USER_TABS} />
    </div>
  );
}
