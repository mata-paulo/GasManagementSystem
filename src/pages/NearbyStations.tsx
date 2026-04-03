import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import BottomNav from "../components/BottomNav";

mapboxgl.accessToken = "pk.eyJ1IjoibWF0YWRldnMiLCJhIjoiY21mNmdhc3YyMGcxdzJrb21xZm80c3NpbCJ9.R0nU8Ip_9RCo-Q2aWxAbXA";

const BRAND_LOGO: Record<string, { bg: string; fg: string; abbr: string }> = {
  Shell:      { bg: "#FBCE07", fg: "#DD1D21", abbr: "SH" },
  Petron:     { bg: "#0059A7", fg: "#ffffff", abbr: "PE" },
  Caltex:     { bg: "#C8102E", fg: "#ffffff", abbr: "CX" },
  Phoenix:    { bg: "#F47920", fg: "#ffffff", abbr: "PX" },
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

const FILTERS = [
  { label: "All" },
  { label: "Shell" },
  { label: "Petron" },
  { label: "Caltex" },
  { label: "Phoenix" },
  { label: "Seaoil" },
  { label: "Flying V" },
  { label: "Diatoms" },
  { label: "Other" },
];

const STANDARD_FUELS = [
  { name: "Diesel",                    type: "Diesel",       price: 0 },
  { name: "Premium Diesel",            type: "PremiumDiesel", price: 0 },
  { name: "Regular/Unleaded (91)",     type: "Gasoline",     price: 0 },
  { name: "Premium (95)",              type: "Premium95",    price: 0 },
  { name: "Super Premium (97)",        type: "Premium97",    price: 0 },
];

const BRAND_FUELS = {
  Shell: STANDARD_FUELS,
  Petron: STANDARD_FUELS,
  Caltex: STANDARD_FUELS,
  Phoenix: STANDARD_FUELS,
  Seaoil: STANDARD_FUELS,
  "Flying V": STANDARD_FUELS,
  Diatoms: STANDARD_FUELS,
  Other: STANDARD_FUELS,
  default: STANDARD_FUELS,
};

const FUEL_TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Diesel:       { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500"  },
  PremiumDiesel:{ bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500"  },
  Gasoline:     { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500"   },
  Premium95:    { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  Premium97:    { bg: "bg-rose-50",   text: "text-rose-700",   dot: "bg-rose-500"   },
};

const STATIC_STATIONS = [
  // ── Shell ──
  { id: 1,  name: "Shell Robinsons Mobility Station",  brand: "Shell",    address: "Sergio Osmena Blvd cor 13th Ave, Cebu City",            rating: 4.5, hours: "8AM–11PM",       lat: 10.3025851, lon: 123.9110295 },
  { id: 2,  name: "Shell – Osmena Blvd / Jones Ave",   brand: "Shell",    address: "Cor. Uytengsu St, Cebu City",                           rating: 4.2, hours: "Open 24 hours",  lat: 10.3039010, lon: 123.8950550 },
  { id: 3,  name: "Shell – N. Escario St",             brand: "Shell",    address: "N. Escario St, Cebu City",                              rating: 4.1, hours: "Open 24 hours",  lat: 10.3176340, lon: 123.8944090 },
  { id: 4,  name: "Shell – Gorordo Ave",               brand: "Shell",    address: "839 Gorordo Ave, Lahug, Cebu City",                     rating: 3.4, hours: "Open 24 hours",  lat: 10.3203694, lon: 123.8994126 },
  { id: 5,  name: "Shell – F. Cabahug St",             brand: "Shell",    address: "F. Cabahug St, Kasambagan, Cebu City",                  rating: 4.3, hours: "Open 24 hours",  lat: 10.3248960, lon: 123.9155940 },
  { id: 6,  name: "Shell – Banilad",                   brand: "Shell",    address: "8888 Gov. M. Cuenco Ave, Banilad, Cebu City",           rating: 3.4, hours: "Open 24 hours",  lat: 10.3446170, lon: 123.9121940 },
  { id: 7,  name: "Shell Talamban Highlands",          brand: "Shell",    address: "Gov. M. Cuenco Ave, Talamban, Cebu City",               rating: 3.7, hours: "Open 24 hours",  lat: 10.3567474, lon: 123.9149518 },
  { id: 8,  name: "Shell – Katipunan St",              brand: "Shell",    address: "240 Katipunan St, Labangon, Cebu City",                 rating: 4.3, hours: "Open 24 hours",  lat: 10.3004390, lon: 123.8746030 },
  { id: 9,  name: "Shell – Basak Pardo",               brand: "Shell",    address: "Natalio B. Bacalso Ave, Basak Pardo, Cebu City",        rating: 4.3, hours: "Open 24 hours",  lat: 10.2882290, lon: 123.8638870 },
  { id: 10, name: "Shell – Mambaling",                 brand: "Shell",    address: "F. Vestil St, Mambaling, Cebu City",                    rating: 4.2, hours: "Open 24 hours",  lat: 10.2875180, lon: 123.8792190 },
  { id: 11, name: "Shell NRA",                         brand: "Shell",    address: "Mandaue Causeway, North Reclamation Area, Cebu City",   rating: 4.1, hours: "Open 24 hours",  lat: 10.3161410, lon: 123.9287640 },
  { id: 12, name: "Shell – MJ Cuenco Ave",             brand: "Shell",    address: "1296 MJ Cuenco Ave, Carreta, Cebu City",                rating: 3.3, hours: "Open 24 hours",  lat: 10.3097020, lon: 123.9080780 },
  { id: 13, name: "Shell – Talamban Rd (Upper)",       brand: "Shell",    address: "Talamban Rd, Talamban, Cebu City",                      rating: 4.6, hours: "Open 24 hours",  lat: 10.3743450, lon: 123.9189170 },
  // ── Petron ──
  { id: 14, name: "Petron – Pope John Paul II Ave",    brand: "Petron",   address: "Pope John Paul II Ave, Apas, Cebu City",                rating: 3.7, hours: "Open 24 hours",  lat: 10.3255071, lon: 123.9074359 },
  { id: 15, name: "Petron – N. Escario St (Guadalupe)",brand: "Petron",   address: "58 N. Escario St, Guadalupe, Cebu City",                rating: 4.2, hours: "Open 24 hours",  lat: 10.3176040, lon: 123.8965360 },
  { id: 16, name: "Petron – F. Cabahug St",            brand: "Petron",   address: "49 F. Cabahug St, Kasambagan, Cebu City",               rating: 4.0, hours: "Open 24 hours",  lat: 10.3254869, lon: 123.9165870 },
  { id: 17, name: "Petron – R. Duterte St",            brand: "Petron",   address: "R. Duterte St, Banawa, Cebu City",                      rating: 3.9, hours: "Open 24 hours",  lat: 10.3156699, lon: 123.8842890 },
  { id: 18, name: "Petron – V Rama Ave",               brand: "Petron",   address: "975 V Rama Ave, Luz/Mabini, Cebu City",                 rating: 4.3, hours: "6AM–10PM",        lat: 10.3169054, lon: 123.8852611 },
  { id: 19, name: "Petron – B. Rodriguez St",          brand: "Petron",   address: "52-58 B. Rodriguez St, Cebu City",                      rating: 3.6, hours: "Open 24 hours",  lat: 10.3083407, lon: 123.8893030 },
  { id: 20, name: "Petron – South Cebu City",          brand: "Petron",   address: "Kinasang-an/Pardo area, Cebu City",                     rating: 4.4, hours: "Open 24 hours",  lat: 10.2967202, lon: 123.8868959 },
  { id: 21, name: "Petron – Near Fuente (Central)",    brand: "Petron",   address: "Central/Cogon Ramos area, Cebu City",                   rating: 4.5, hours: "Open 24 hours",  lat: 10.3131564, lon: 123.9127650 },
  { id: 22, name: "Petron – Punta Princesa",           brand: "Petron",   address: "Francisco Llamas St, Punta Princesa, Cebu City",        rating: null, hours: "Open 24 hours", lat: 10.2978993, lon: 123.8698921 },
  { id: 23, name: "Petron – Tisa",                     brand: "Petron",   address: "Katipunan St, Tisa, Cebu City",                         rating: 4.2, hours: "Open 24 hours",  lat: 10.3013564, lon: 123.8720431 },
  // ── Caltex ──
  { id: 24, name: "Caltex – Landers Cebu",             brand: "Caltex",   address: "115 Pope John Paul II Ave, Cebu City",                  rating: 4.2, hours: "8AM–9PM",         lat: 10.3210638, lon: 123.9103713 },
  { id: 25, name: "Caltex – T. Padilla / MJ Cuenco",   brand: "Caltex",   address: "T. Padilla cor MJ Cuenco Ave, Cebu City",               rating: 4.4, hours: "Open 24 hours",  lat: 10.3021098, lon: 123.9064052 },
  { id: 26, name: "Caltex – Magallanes St",            brand: "Caltex",   address: "Magallanes cor Climaco St, Cebu City",                  rating: 4.3, hours: "7AM–10:30PM",     lat: 10.2932211, lon: 123.8957413 },
  { id: 27, name: "Caltex – Cebu South Rd",            brand: "Caltex",   address: "1074 Cebu South Rd, Basak, Cebu City",                  rating: 4.0, hours: "Open 24 hours",  lat: 10.2832112, lon: 123.8588417 },
  { id: 28, name: "Caltex – Filimon Sotto Dr",         brand: "Caltex",   address: "Filimon Sotto Dr, Cogon Ramos, Cebu City",              rating: 3.8, hours: "Open 24 hours",  lat: 10.3150129, lon: 123.9015140 },
  { id: 29, name: "Caltex – Tres de Abril St",         brand: "Caltex",   address: "567 Tres de Abril St, Punta Princesa, Cebu City",       rating: null, hours: "Open 24 hours", lat: 10.2978418, lon: 123.8844870 },
  // ── Phoenix ──
  { id: 30, name: "Phoenix Petroleum – Banilad",       brand: "Phoenix",  address: "Gov. Cuenco Ave cor Paradise Village Rd, Banilad",      rating: 3.9, hours: "Open 24 hours",  lat: 10.3354793, lon: 123.9110667 },
  { id: 31, name: "Phoenix Gas Station – Mambaling",   brand: "Phoenix",  address: "Main Rd, Mambaling, Cebu City",                         rating: 3.9, hours: "Open 24 hours",  lat: 10.2895116, lon: 123.8781982 },
  // ── Seaoil ──
  { id: 32, name: "SEAOIL – Tres de Abril St",         brand: "Seaoil",   address: "Tres de Abril St, Punta Princesa, Cebu City",           rating: 4.4, hours: "6AM–10PM",        lat: 10.2966476, lon: 123.8755522 },
  { id: 33, name: "SeaOil – Bacalso Ave",              brand: "Seaoil",   address: "Natalio B. Bacalso Ave, Duljo-Fatima, Cebu City",       rating: 3.6, hours: "8AM–10PM",        lat: 10.2987601, lon: 123.8938398 },
  // ── Flying V ──
  { id: 34, name: "Flying V – Pit-os",                 brand: "Flying V", address: "Brgy. Pit-os, Cebu City",                               rating: 4.0, hours: "Open 24 hours",  lat: 10.3960743, lon: 123.9218555 },
  { id: 35, name: "Flying V – Tugas",                  brand: "Flying V", address: "F. Jaca St, Tugas, Cebu City",                          rating: 4.5, hours: "Open 24 hours",  lat: 10.2743392, lon: 123.8568358 },
  // ── Diatoms ──
  { id: 36, name: "Diatoms Fuel – Tisa",               brand: "Diatoms",  address: "654 Katipunan St, Tisa, Cebu City",                     rating: 4.6, hours: "6:30AM–11PM",     lat: 10.2998279, lon: 123.8742939 },
  { id: 37, name: "Diatoms Fuel – P. Del Rosario St",  brand: "Diatoms",  address: "Pantaleon del Rosario St, Pahina Central, Cebu City",   rating: 4.6, hours: "6AM–11PM",        lat: 10.3011824, lon: 123.9001353 },
  // ── Other ──
  { id: 38, name: "Fueltech Philippines",              brand: "Other",    address: "120 Juan Luna Ave Ext, Tinago, Cebu City",              rating: 3.6, hours: "Open 24 hours",  lat: 10.3088927, lon: 123.9188045 },
  { id: 39, name: "Unioil – Lahug",                    brand: "Other",    address: "Gorordo Ave, Lahug, Cebu City",                         rating: 5.0, hours: "Open 24 hours",  lat: 10.3306989, lon: 123.8978075 },
  { id: 40, name: "Total – Basak Pardo",               brand: "Other",    address: "Cor. Macopa St, To-ong Pardo, Cebu City",               rating: 4.0, hours: "Open 24 hours",  lat: 10.2890730, lon: 123.8667544 },
  { id: 41, name: "Rephil – Pardo",                    brand: "Other",    address: "Natalio B. Bacalso Ave, Pardo, Cebu City",              rating: 4.0, hours: "Open 24 hours",  lat: 10.2772790, lon: 123.8528685 },
  { id: 42, name: "Triune Gasoline Station",           brand: "Other",    address: "Sudlon, Cebu City",                                     rating: 3.9, hours: "Open 24 hours",  lat: 10.3273451, lon: 123.8897226 },
  { id: 43, name: "C3 Fuels – Labangon",               brand: "Other",    address: "Salvador St, Labangon, Cebu City",                      rating: 3.3, hours: "Open 24 hours",  lat: 10.3038213, lon: 123.8774881 },
  { id: 44, name: "Geminie Gas Station",               brand: "Other",    address: "Talamban Rd, Talamban, Cebu City",                      rating: 4.2, hours: "Open 24 hours",  lat: 10.3780830, lon: 123.9197880 },
  { id: 45, name: "Gas Up – Cebu South Rd",            brand: "Other",    address: "Cebu South Rd, Quiot Pardo, Cebu City",                 rating: 4.3, hours: "Open 24 hours",  lat: 10.2775470, lon: 123.8536222 },
  { id: 46, name: "JSY Gasoline Station",              brand: "Other",    address: "397 Candido Padilla St, Kalunasan, Cebu City",          rating: 3.4, hours: "6AM–9PM",         lat: 10.2926469, lon: 123.8840626 },
  { id: 47, name: "SGD Gas Station",                   brand: "Other",    address: "Sirao/Busay area, Cebu City",                           rating: 4.3, hours: "Open 24 hours",  lat: 10.3997749, lon: 123.9210498 },
  { id: 48, name: "2010 Gas Station",                  brand: "Other",    address: "Cebu Veterans Dr, Busay, Cebu City",                    rating: 4.2, hours: "Open 24 hours",  lat: 10.3462289, lon: 123.8937715 },
  { id: 49, name: "LKB Gas Station",                   brand: "Other",    address: "Sitio Tugop, Sudlon/TCH area, Cebu City",               rating: 4.2, hours: "Open 24 hours",  lat: 10.3750034, lon: 123.8527869 },
  { id: 50, name: "SALLEVER Fuel Stop",                brand: "Other",    address: "Agsungot Road, Agsungot, Cebu City",                    rating: null, hours: "Open 24 hours", lat: 10.4366961, lon: 123.9045320 },
  { id: 51, name: "Cogon Gas Station",                 brand: "Other",    address: "Cogon Pardo, Cebu City",                                rating: null, hours: "Open 24 hours", lat: 10.2780982, lon: 123.8581071 },
  { id: 52, name: "Aura Fuels Inc",                    brand: "Other",    address: "V Rama Ave, Cebu City",                                 rating: null, hours: "Open 24 hours", lat: 10.3213223, lon: 123.8840814 },
  { id: 53, name: "Light Fuels – North Reclamation",   brand: "Other",    address: "North Reclamation Area, Cebu City",                     rating: 5.0, hours: "5AM–11PM",        lat: 10.3253554, lon: 123.9385335 },
  { id: 54, name: "Oh My Gas Marketing",               brand: "Other",    address: "Talamban area, Cebu City",                              rating: 5.0, hours: "Open 24 hours",  lat: 10.3816738, lon: 123.9207148 },
];

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

  const drawerOpen = drawerHeight > PEEK_HEIGHT + 20;
  const drawerRef = useRef<HTMLDivElement>(null);
  const stationRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const stationListRef = useRef<HTMLDivElement>(null);
  const handleBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;
    el.style.height = `${drawerHeight}px`;
    el.style.transition = isDragging ? "none" : "height 0.3s cubic-bezier(0.32,0.72,0,1)";
  }, [drawerHeight, isDragging]);

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

  // ── Load static stations ────────────────────────────────────────────────────
  useEffect(() => {
    if (!location) return;
    const { lat, lon } = location;
    setLoadingStations(true);
    const withDistance = STATIC_STATIONS
      .map((st) => ({ ...st, distance: getDistance(lat, lon, st.lat, st.lon) }))
      .sort((a, b) => a.distance - b.distance);
    setStations(withDistance);
    setLoadingStations(false);
  }, [location]);

  const filteredStations =
    activeFilter === "All"
      ? stations
      : stations.filter((st) => st.brand === activeFilter);

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
      map.fitBounds(bounds, { padding: { top: 80, bottom: OPEN_HEIGHT + 24, left: 40, right: 40 }, duration: 900 });
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
    setExpandedId(st.id);
    setDrawerHeight(OPEN_HEIGHT);
    drawRoute(st);
    mapRef.current?.flyTo({ center: [st.lon, st.lat], zoom: 15, duration: 800 });
    setTimeout(() => {
      const listEl = stationListRef.current;
      const stationEl = stationRefs.current[st.id];
      if (!listEl || !stationEl) return;
      const listRect = listEl.getBoundingClientRect();
      const stationRect = stationEl.getBoundingClientRect();
      const offset = stationRect.top - listRect.top + listEl.scrollTop - 8;
      listEl.scrollTo({ top: offset, behavior: "smooth" });
    }, 320);
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

      {/* Map — fills remaining space */}
      <div className="relative flex-1">
        {locating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest z-10 gap-3">
            <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-on-surface-variant font-medium">Getting your location…</p>
          </div>
        )}

        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Filter chips */}
        <div className="no-scrollbar absolute top-3 left-0 right-0 z-10 flex gap-2 px-3 overflow-x-auto">
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
            onClick={() => location && mapRef.current?.flyTo({ center: [location.lon, location.lat], zoom: 14, duration: 800 })}
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

        {/* ── Drawer ── */}
        <div
          ref={drawerRef}
          className="absolute left-0 right-0 bottom-0 z-30 bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Handle bar — draggable */}
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
                  <p className="text-[10px] text-slate-400">{filteredStations.length} stations within 5 km</p>
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
                <p className="text-white text-xs font-medium">Calculating route…</p>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate">{selectedStation.name}</p>
                  <p className="text-white/70 text-[10px]">{formatDist(routeInfo.distance)} · {formatDuration(routeInfo.duration)} drive</p>
                </div>
              )}
              <button onClick={() => { clearRoute(); setSelectedStation(null); }} className="text-white/60 hover:text-white shrink-0">
                <span className="material-symbols-outlined icon-base">close</span>
              </button>
            </div>
          )}

          {/* Station list */}
          <div ref={stationListRef} className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 space-y-2">
            {loadingStations && [1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
            ))}

            {!loadingStations && filteredStations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <span className="material-symbols-outlined text-gray-300 text-[36px]">not_listed_location</span>
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
                  ref={(el) => { stationRefs.current[st.id] = el; }}
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
                      {(() => {
                        const bl = BRAND_LOGO[st.brand] ?? BRAND_LOGO.Other;
                        return (
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-headline font-black text-sm"
                            style={{ background: bl.bg, color: bl.fg }}
                          >
                            {bl.abbr}
                          </div>
                        );
                      })()}
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
                        className={`material-symbols-outlined transition-transform duration-200 icon-base ${isExpanded ? "rotate-180" : ""}`}
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
                              ₱{fuel.price ?? 0}
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
