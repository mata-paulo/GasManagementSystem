import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });
import BottomNav from "@/shared/components/navigation/BottomNav";
import { fetchStationDirectory } from "@/lib/data/agas";

const BRAND_LOGO: Record<string, { bg: string; fg: string; abbr: string }> = {
  Shell:      { bg: "#FBCE07", fg: "#DD1D21", abbr: "SH" },
  Petron:     { bg: "#0059A7", fg: "#ffffff", abbr: "PE" },
  Caltex:     { bg: "#C8102E", fg: "#ffffff", abbr: "CX" },
  Phoenix:    { bg: "#F47920", fg: "#ffffff", abbr: "PX" },
  "Sea Oil":  { bg: "#00677F", fg: "#ffffff", abbr: "SO" },
  Seaoil:     { bg: "#00677F", fg: "#ffffff", abbr: "SO" },
  "Flying V": { bg: "#8B1A1A", fg: "#ffffff", abbr: "FV" },
  Diatoms:    { bg: "#2E7D32", fg: "#ffffff", abbr: "DI" },
  Other:      { bg: "#003366", fg: "#ffffff", abbr: "⛽" },
};

const USER_TABS = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "user-history", icon: "receipt_long", label: "Transactions" },
  { id: "map", icon: "map", label: "Map" },
  { id: "settings", icon: "account_circle", label: "Account" },
];

const DEFAULT_LAT = 10.3157;
const DEFAULT_LON = 123.8854;

const FUEL_TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Diesel:       { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500"  },
  PremiumDiesel:{ bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500"  },
  Gasoline:     { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500"   },
  Premium95:    { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  Premium97:    { bg: "bg-rose-50",   text: "text-rose-700",   dot: "bg-rose-500"   },
};

function normalizeBrandKey(value) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function inferFuelType(label) {
  const normalized = (label || "").toLowerCase();
  if (normalized.includes("premium diesel")) return "PremiumDiesel";
  if (normalized.includes("diesel")) return "Diesel";
  if (normalized.includes("97") || normalized.includes("racing")) return "Premium97";
  if (normalized.includes("95") || normalized.includes("premium") || normalized.includes("silver") || normalized.includes("blaze")) return "Premium95";
  return "Gasoline";
}

function normalizeStationBrand(brand) {
  const normalized = normalizeBrandKey(brand);
  if (normalized === "seaoil") return "Sea Oil";
  return brand;
}
function mapDirectoryStation(station) {
  return {
    id: station.id,
    sourceId: station.sourceId,
    name: station.name,
    brand: normalizeStationBrand(station.brand),
    address: station.address,
    rating: station.rating ?? null,
    hours: station.hours,
    lat: station.lat,
    lon: station.lon,
    brandPrices: Array.isArray(station.brandPrices)
      ? station.brandPrices.map((item) => ({
          name: item.label,
          type: inferFuelType(item.label),
          price: item.price,
        }))
      : [],
  };
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
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const dragStartY = useRef(null);
  const dragStartHeight = useRef(null);

  const PEEK_HEIGHT = Math.round(window.innerHeight * 0.28);
  const OPEN_HEIGHT = Math.round(window.innerHeight * 0.58);

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
  const [currentPage, setCurrentPage] = useState(0);

  const PAGE_SIZE = 5;

  const drawerOpen = drawerHeight > PEEK_HEIGHT + 20;
  const drawerRef = useRef<HTMLDivElement>(null);
  const stationRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stationListRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const handleBarRef = useRef<HTMLDivElement>(null);
  const markerElsRef = useRef<Record<string, HTMLElement>>({});

  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;
    el.style.height = `${drawerHeight}px`;
    el.style.transition = isDragging ? "none" : "height 0.3s cubic-bezier(0.32,0.72,0,1)";
  }, [drawerHeight, isDragging]);

  // â”€â”€ Location â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Map init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!location || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      preferCanvas: true,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: false,
    }).setView([location.lat, location.lon], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: 'Â© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      updateWhenIdle: false,
      updateWhenZooming: false,
      keepBuffer: 4,
    }).addTo(map);

    const el = document.createElement("div");
    el.style.cssText =
      "width:18px;height:18px;border-radius:50%;background:#003366;border:3px solid #fff;box-shadow:0 0 0 4px rgba(0,51,102,0.25)";
    const userIcon = L.divIcon({ html: el.outerHTML, className: "", iconSize: [18, 18], iconAnchor: [9, 9] });
    L.marker([location.lat, location.lon], { icon: userIcon })
      .bindPopup("You are here")
      .addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [location]);

  // â”€â”€ Load live stations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!location) return;
    let cancelled = false;

    const loadStations = async () => {
      const { lat, lon } = location;
      setLoadingStations(true);

      try {
        const directoryStations = await fetchStationDirectory();

        if (cancelled) return;

        const withDistance = directoryStations
          .map((station) => mapDirectoryStation(station))
          .map((st) => ({ ...st, distance: getDistance(lat, lon, st.lat, st.lon) }))
          .sort((a, b) => a.distance - b.distance);
        setStations(withDistance);
      } catch {
        if (cancelled) return;

        setStations([]);
      } finally {
        if (!cancelled) {
          setLoadingStations(false);
        }
      }
    };

    void loadStations();

    return () => {
      cancelled = true;
    };
  }, [location]);

  const filters = useMemo(() => {
    const brands = Array.from(new Set(stations.map((station) => station.brand).filter(Boolean)));
    return [{ label: "All" }, ...brands.sort((a, b) => a.localeCompare(b)).map((label) => ({ label }))];
  }, [stations]);

  const filteredStations =
    activeFilter === "All"
      ? stations
      : stations.filter((st) => normalizeBrandKey(st.brand) === normalizeBrandKey(activeFilter));

  const totalPages = Math.ceil(filteredStations.length / PAGE_SIZE);

  // Reset to first page when filter changes
  useEffect(() => { setCurrentPage(0); }, [activeFilter]);

  // â”€â”€ Markers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    markerElsRef.current = {};

    if (filteredStations.length === 0) return;

    const layerGroup = L.layerGroup();

    filteredStations.forEach((st) => {
      const el = document.createElement("div");
      el.style.cssText = `
        width:32px;height:32px;border-radius:50%;
        background:#003366;
        border:2px solid #fff;display:flex;align-items:center;
        justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.35);
        cursor:pointer;font-size:16px;
      `;
      el.innerHTML = "â›½";
      el.addEventListener("click", () => handleSelectStation(st));

      markerElsRef.current[st.id] = el;

      const icon = L.divIcon({ html: el.outerHTML, className: "", iconSize: [32, 32], iconAnchor: [16, 16] });
      const marker = L.marker([st.lat, st.lon], { icon });
      layerGroup.addLayer(marker);

      markersRef.current.push(marker);
    });

    layerGroup.addTo(map);

    // attach click via the underlying DOM element after markers are in the DOM
    markersRef.current.forEach((marker, idx) => {
      const st = filteredStations[idx];
      marker.getElement()?.addEventListener("click", () => handleSelectStation(st));
    });
  }, [filteredStations]);

  // â”€â”€ Sync marker highlight with selectedStation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    markersRef.current.forEach((m, idx) => {
      const st = filteredStations[idx];
      if (!st) return;
      const el = m.getElement()?.querySelector("div") as HTMLElement | null;
      if (!el) return;
      const isActive = selectedStation?.id === st.id;
      el.style.background = isActive ? "#c9a227" : "#003366";
      el.style.fontSize = isActive ? "18px" : "16px";
    });
  }, [selectedStation, filteredStations]);

  // â”€â”€ Route drawing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const drawRoute = async (st) => {
    if (!location) return;
    const map = mapRef.current;
    if (!map) return;

    setLoadingRoute(true);
    setRouteInfo(null);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${location.lon},${location.lat};${st.lon},${st.lat}?overview=full&geometries=geojson`;
      const data = await fetch(url).then((r) => r.json());
      const route = data.routes?.[0];
      if (!route) return;

      setRouteInfo({ distance: route.distance, duration: route.duration });

      // Remove existing route polyline
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }

      // GeoJSON coords are [lng, lat] â€” flip to Leaflet [lat, lng]
      const latLngs: L.LatLngExpression[] = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

      // Outline (white, wider)
      L.polyline(latLngs, { color: "#fff", weight: 8, opacity: 0.8 }).addTo(map);
      // Main line (navy)
      const routeLine = L.polyline(latLngs, { color: "#003366", weight: 5, opacity: 0.95 }).addTo(map);
      routePolylineRef.current = routeLine;

      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { paddingTopLeft: [40, 80], paddingBottomRight: [40, OPEN_HEIGHT + 24], animate: true });
    } catch {
      // silently fail
    } finally {
      setLoadingRoute(false);
    }
  };

  const clearRoute = () => {
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    setRouteInfo(null);
  };

  const handleSelectStation = (st) => {
    setSelectedStation(st);
    setExpandedId(st.id);
    setDrawerHeight(OPEN_HEIGHT);
    drawRoute(st);
    mapRef.current?.flyTo([st.lat, st.lon], 15);
    // Scroll carousel to the page containing this station
    const stIdx = filteredStations.findIndex((s) => s.id === st.id);
    if (stIdx >= 0) {
      const page = Math.floor(stIdx / PAGE_SIZE);
      setTimeout(() => {
        carouselRef.current?.scrollTo({ left: page * (carouselRef.current?.offsetWidth ?? 0), behavior: "smooth" });
      }, 320);
    }
  };

  // â”€â”€ Drawer drag â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  useEffect(() => {
    const el = handleBarRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleDragMove(e.touches[0].clientY);
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  });

  const handleHandleClick = () => {
    if (isDragging) return;
    setDrawerHeight(drawerOpen ? PEEK_HEIGHT : OPEN_HEIGHT);
  };

  return (
    <div className="flex flex-col bg-background h-dvh">

      {/* Header */}
      <div className="flex items-center px-6 py-4 bg-primary-container shadow-sm shrink-0">
        <div className="flex-1 flex flex-col items-center">
          <h1 className="text-white font-headline font-bold text-lg leading-none">Nearby Stations</h1>
          <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-0.5">Gas stations within 5 km</p>
        </div>
        <span className="material-symbols-outlined text-tertiary-fixed icon-filled text-[28px]">
          local_gas_station
        </span>
      </div>

      {/* Map â€” fills remaining space */}
      <div className="relative flex-1">
        {locating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest z-10 gap-3">
            <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-on-surface-variant font-medium">Getting your locationâ€¦</p>
          </div>
        )}

        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Filter chips */}
        <div className="no-scrollbar absolute top-3 left-0 right-0 z-10 flex gap-2 px-3 overflow-x-auto">
          {filters.map((f) => {
            const active = activeFilter === f.label;
            return (
              <button
                key={f.label}
                onClick={() => setActiveFilter(f.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md border transition-all active:scale-95 ${
                  active ? "bg-[#003366] text-white border-[#003366]" : "bg-white text-slate-700 border-white/80"
                }`}
              >
                <span className={`material-symbols-outlined text-[14px] ${active ? "icon-filled" : "icon-outline"}`}>
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
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
          <button onClick={() => mapRef.current?.zoomOut()} className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-slate-700 active:scale-95 transition-all border border-white/80">
            <span className="material-symbols-outlined text-[20px]">remove</span>
          </button>
          <button
            onClick={() => location && mapRef.current?.flyTo([location.lat, location.lon], 14)}
            className="w-9 h-9 bg-[#003366] rounded-xl shadow-md flex items-center justify-center text-white active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined icon-filled text-[20px]">my_location</span>
          </button>
        </div>

        {geoError && (
          <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm z-10">
            {geoError}
          </div>
        )}

        {/* â”€â”€ Drawer â”€â”€ */}
        <div
          ref={drawerRef}
          className="absolute left-0 right-0 bottom-0 z-30 bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Handle bar â€” draggable */}
          <div
            ref={handleBarRef}
            className="flex flex-col items-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing select-none"
            onClick={handleHandleClick}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
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
                  <p className="text-[10px] text-slate-400">
                    {currentPage * PAGE_SIZE + 1}â€“{Math.min((currentPage + 1) * PAGE_SIZE, filteredStations.length)} of {filteredStations.length} stations Â· nearest first
                  </p>
                )}
              </div>
              <span
                className={`material-symbols-outlined text-slate-400 transition-transform duration-300 text-[22px] ${drawerOpen ? "rotate-180" : ""}`}
              >
                expand_less
              </span>
            </div>
          </div>

          {/* Route info bar */}
          {(loadingRoute || routeInfo) && selectedStation && (
            <div className="mx-4 mb-2 px-4 py-2.5 bg-[#003366] rounded-xl flex items-center gap-3 shrink-0">
              <span className="material-symbols-outlined text-white icon-filled text-[20px]">route</span>
              {loadingRoute ? (
                <p className="text-white text-xs font-medium">Calculating routeâ€¦</p>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate">{selectedStation.name}</p>
                  <p className="text-white/70 text-[10px]">{formatDist(routeInfo.distance)} Â· {formatDuration(routeInfo.duration)} drive</p>
                </div>
              )}
              <button onClick={() => { clearRoute(); setSelectedStation(null); }} className="text-white/60 hover:text-white shrink-0">
                <span className="material-symbols-outlined icon-base">close</span>
              </button>
            </div>
          )}

          {/* Carousel â€” horizontal scroll, one page of 5 stations per slide */}
          <div className="flex-1 flex flex-col min-h-0">
            {loadingStations && (
              <div className="px-4 space-y-2 pt-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />)}
              </div>
            )}

            {!loadingStations && filteredStations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <span className="material-symbols-outlined text-gray-300 text-[36px]">not_listed_location</span>
                <p className="text-xs text-slate-400 font-medium">No stations found.</p>
              </div>
            )}

            {!loadingStations && filteredStations.length > 0 && (
              <>
                {/* Slides */}
                <div
                  ref={carouselRef}
                  className="flex-1 flex overflow-x-auto no-scrollbar"
                  style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const page = Math.round(el.scrollLeft / el.offsetWidth);
                    setCurrentPage(page);
                  }}
                >
                  {Array.from({ length: totalPages }).map((_, pageIdx) => {
                    const pageStations = filteredStations.slice(pageIdx * PAGE_SIZE, (pageIdx + 1) * PAGE_SIZE);
                    return (
                      <div
                        key={pageIdx}
                        className="shrink-0 w-full overflow-y-auto no-scrollbar px-4 py-2 space-y-2"
                        style={{ scrollSnapAlign: "start" }}
                      >
                        {pageStations.map((st) => {
                          const isSelected = selectedStation?.id === st.id;
                          const isExpanded = expandedId === st.id;
                          const fuels = st.brandPrices ?? [];
                          return (
                            <div
                              key={st.id}
                              ref={(el) => { stationRefs.current[st.id] = el; }}
                              className={`rounded-xl border overflow-hidden transition-all ${isSelected ? "border-[#003366]" : "border-slate-100"}`}
                            >
                              <div className="flex items-center gap-3 p-3 bg-white">
                                <button onClick={() => handleSelectStation(st)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                  {(() => {
                                    const bl = BRAND_LOGO[st.brand] ?? BRAND_LOGO.Other;
                                    return (
                                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-headline font-black text-sm" style={{ background: bl.bg, color: bl.fg }}>
                                        {bl.abbr}
                                      </div>
                                    );
                                  })()}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${isSelected ? "text-[#003366]" : "text-slate-800"}`}>{st.name}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {formatDist(st.distance)}
                                      {isSelected && routeInfo && !loadingRoute && <span> Â· {formatDuration(routeInfo.duration)} drive</span>}
                                    </p>
                                  </div>
                                </button>
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : st.id)}
                                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? "bg-[#003366] text-white" : "bg-slate-100 text-slate-500"}`}
                                >
                                  <span className={`material-symbols-outlined transition-transform duration-200 icon-base ${isExpanded ? "rotate-180" : ""}`}>expand_more</span>
                                </button>
                              </div>
                              {isExpanded && (
                                <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 space-y-1.5">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Available Fuels</p>
                                  {fuels.length > 0 ? fuels.map((fuel) => {
                                    const colors = FUEL_TYPE_COLORS[fuel.type] || FUEL_TYPE_COLORS.Gasoline;
                                    return (
                                      <div key={fuel.name} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${colors.bg}`}>
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                                        <p className={`text-xs font-semibold flex-1 ${colors.text}`}>{fuel.name}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 ${colors.text}`}>â‚±{fuel.price ?? 0}</span>
                                      </div>
                                    );
                                  }) : (
                                    <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-3 text-xs text-slate-500">
                                      No live fuel prices published yet for this station.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Dot indicators */}
                {totalPages > 1 && (
                  <div className="shrink-0 flex items-center justify-center gap-1.5 py-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => carouselRef.current?.scrollTo({ left: i * carouselRef.current.offsetWidth, behavior: "smooth" })}
                        className={`rounded-full transition-all ${i === currentPage ? "w-4 h-1.5 bg-[#003366]" : "w-1.5 h-1.5 bg-slate-300"}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Spacer â€” reserves the fixed bottom nav's height in the flex layout so the map container stops above it */}
      <div className="shrink-0 h-[100px]" />
      <BottomNav active={activeTab} onChange={onTabChange} tabs={USER_TABS} />
    </div>
  );
}

