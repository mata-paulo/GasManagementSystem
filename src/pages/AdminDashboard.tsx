import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = "pk.eyJ1IjoibWF0YWRldnMiLCJhIjoiY21mNmdhc3YyMGcxdzJrb21xZm80c3NpbCJ9.R0nU8Ip_9RCo-Q2aWxAbXA";

/* ─── Mock Data ─── */
const STATIONS = [
  { id: 1,  name: "Shell – Fuente Osmeña",    brand: "Shell",    barangay: "Ermita",            officer: "Ricardo Santos",    capacity: 150000, dispensed: 4820, lat: 10.3157, lng: 123.8959, status: "Online"  },
  { id: 2,  name: "Petron – Jones Ave",        brand: "Petron",   barangay: "Lorega San Miguel", officer: "Gemma Reyes",       capacity: 120000, dispensed: 3610, lat: 10.3031, lng: 123.8967, status: "Online"  },
  { id: 3,  name: "Caltex – Lahug",            brand: "Caltex",   barangay: "Lahug",             officer: "Manuel Flores",     capacity: 100000, dispensed: 2940, lat: 10.3363, lng: 123.9002, status: "Online"  },
  { id: 4,  name: "Shell – Mabolo",            brand: "Shell",    barangay: "Mabolo",            officer: "Carla Villanueva",  capacity: 180000, dispensed: 5310, lat: 10.3236, lng: 123.9149, status: "Online"  },
  { id: 5,  name: "Phoenix – Banilad",         brand: "Phoenix",  barangay: "Banilad",           officer: "Jose Magbanua",     capacity:  90000, dispensed: 2150, lat: 10.3461, lng: 123.9032, status: "Online"  },
  { id: 6,  name: "Sea Oil – Pardo",           brand: "Sea Oil",  barangay: "Basak Pardo",       officer: "Nora Aquino",       capacity:  80000, dispensed: 1870, lat: 10.2876, lng: 123.8864, status: "Offline" },
  { id: 7,  name: "Petron – Guadalupe",        brand: "Petron",   barangay: "Guadalupe",         officer: "Andres Castillo",   capacity: 110000, dispensed: 3290, lat: 10.3002, lng: 123.9203, status: "Online"  },
  { id: 8,  name: "Shell – Talamban",          brand: "Shell",    barangay: "Talamban",          officer: "Edna Bautista",     capacity: 200000, dispensed: 6140, lat: 10.3645, lng: 123.9089, status: "Online"  },
  { id: 9,  name: "Caltex – Mandaue",          brand: "Caltex",   barangay: "Kasambagan",        officer: "Victor Ocampo",     capacity: 130000, dispensed: 3880, lat: 10.3489, lng: 123.9213, status: "Online"  },
  { id: 10, name: "Phoenix – Capitol Site",    brand: "Phoenix",  barangay: "Capitol Site",      officer: "Liza Pangilinan",   capacity:  95000, dispensed: 2460, lat: 10.3121, lng: 123.8934, status: "Online"  },
  { id: 11, name: "Petron – Tisa",             brand: "Petron",   barangay: "Tisa",              officer: "Bobby Soriano",     capacity:  85000, dispensed: 1990, lat: 10.2934, lng: 123.9021, status: "Online"  },
  { id: 12, name: "Sea Oil – Basak",           brand: "Sea Oil",  barangay: "Basak San Nicolas", officer: "Felicitas Cruz",    capacity:  75000, dispensed: 1540, lat: 10.3058, lng: 123.9178, status: "Offline" },
];

const RESIDENTS = [
  { id: 1,  name: "Rico Blanco",         plate: "GAE-1234", barangay: "Mabolo",      vehicle: "Car",        remaining: 5.0,  used: 15.0, status: "Active" },
  { id: 2,  name: "Maria Clara Santos",  plate: "YHM-8890", barangay: "Lahug",       vehicle: "Car",        remaining: 0.0,  used: 20.0, status: "Maxed"  },
  { id: 3,  name: "Juan Dela Cruz",      plate: "ABC-5678", barangay: "Banilad",     vehicle: "Motorcycle", remaining: 11.5, used: 8.5,  status: "Active" },
  { id: 4,  name: "Lorna Villanueva",    plate: "PQR-3310", barangay: "Guadalupe",   vehicle: "Car",        remaining: 9.5,  used: 10.5, status: "Active" },
  { id: 5,  name: "Ramon Castillo",      plate: "STU-7721", barangay: "Capitol Site",vehicle: "Car",        remaining: 2.0,  used: 18.0, status: "Active" },
  { id: 6,  name: "Ana Reyes",           plate: "XYZ-9900", barangay: "Ermita",      vehicle: "Car",        remaining: 8.0,  used: 12.0, status: "Active" },
  { id: 7,  name: "Carlos Fernandez",    plate: "LMN-4412", barangay: "Talamban",    vehicle: "Motorcycle", remaining: 0.0,  used: 20.0, status: "Maxed"  },
  { id: 8,  name: "Grace Tolentino",     plate: "VWX-6650", barangay: "Tisa",        vehicle: "Car",        remaining: 5.0,  used: 15.0, status: "Active" },
  { id: 9,  name: "Eduardo Mendoza",     plate: "BCD-1133", barangay: "Kasambagan",  vehicle: "Motorcycle", remaining: 11.0, used: 9.0,  status: "Active" },
  { id: 10, name: "Felisa Bautista",     plate: "EFG-2244", barangay: "Basak Pardo", vehicle: "Car",        remaining: 0.0,  used: 20.0, status: "Maxed"  },
  { id: 11, name: "Rommel Aquino",       plate: "HIJ-5566", barangay: "Mabolo",      vehicle: "Car",        remaining: 5.5,  used: 14.5, status: "Active" },
  { id: 12, name: "Teresita Magbanua",   plate: "KLM-8877", barangay: "Banilad",     vehicle: "Car",        remaining: 9.0,  used: 11.0, status: "Active" },
  { id: 13, name: "Bernardo Ocampo",     plate: "NOP-1122", barangay: "Guadalupe",   vehicle: "Motorcycle", remaining: 3.0,  used: 17.0, status: "Active" },
  { id: 14, name: "Shirley Pangilinan",  plate: "QRS-4455", barangay: "Lahug",       vehicle: "Car",        remaining: 0.0,  used: 20.0, status: "Maxed"  },
  { id: 15, name: "Vicente Soriano",     plate: "TUV-7788", barangay: "Capitol Site",vehicle: "Motorcycle", remaining: 13.5, used: 6.5,  status: "Active" },
  { id: 16, name: "Dolores Ramos",       plate: "WXY-6633", barangay: "Talamban",    vehicle: "Car",        remaining: 20.0, used: 0.0,  status: "New"    },
  { id: 17, name: "Alfredo Cruz",        plate: "ZAB-1100", barangay: "Tisa",        vehicle: "Car",        remaining: 14.0, used: 6.0,  status: "Active" },
  { id: 18, name: "Marites Gomez",       plate: "CDE-7744", barangay: "Ermita",      vehicle: "Motorcycle", remaining: 7.5,  used: 12.5, status: "Active" },
];

const RECENT_TXN = [
  { id: 1, resident: "Rico Blanco",        station: "Shell – Fuente Osmeña", plate: "GAE-1234", liters: 15.0, type: "Regular", time: "10:24 AM", date: "Today"     },
  { id: 2, resident: "Maria Clara Santos", station: "Petron – Jones Ave",    plate: "YHM-8890", liters: 20.0, type: "Diesel",  time: "09:45 AM", date: "Today"     },
  { id: 3, resident: "Juan Dela Cruz",     station: "Caltex – Lahug",        plate: "ABC-5678", liters: 8.5,  type: "Premium", time: "08:12 AM", date: "Today"     },
  { id: 4, resident: "Lorna Villanueva",   station: "Shell – Mabolo",        plate: "PQR-3310", liters: 10.5, type: "Regular", time: "07:10 AM", date: "Today"     },
  { id: 5, resident: "Ramon Castillo",     station: "Phoenix – Banilad",     plate: "STU-7721", liters: 18.0, type: "Premium", time: "06:58 AM", date: "Today"     },
  { id: 6, resident: "Ana Reyes",          station: "Petron – Guadalupe",    plate: "XYZ-9900", liters: 12.0, type: "Regular", time: "03:30 PM", date: "Yesterday" },
  { id: 7, resident: "Carlos Fernandez",   station: "Shell – Talamban",      plate: "LMN-4412", liters: 20.0, type: "Diesel",  time: "01:15 PM", date: "Yesterday" },
  { id: 8, resident: "Grace Tolentino",    station: "Sea Oil – Pardo",       plate: "VWX-6650", liters: 15.0, type: "Diesel",  time: "11:40 AM", date: "Yesterday" },
];

const BRAND_COLORS = {
  Shell:     { bg: "#fff3e0", text: "#e65100", dot: "#f57c00" },
  Petron:    { bg: "#e3f2fd", text: "#1565c0", dot: "#1976d2" },
  Caltex:    { bg: "#fce4ec", text: "#c62828", dot: "#e53935" },
  Phoenix:   { bg: "#f3e5f5", text: "#6a1b9a", dot: "#8e24aa" },
  "Sea Oil": { bg: "#e8f5e9", text: "#2e7d32", dot: "#43a047" },
};

const NAV_ITEMS = [
  { id: "overview",      icon: "dashboard",          label: "Overview"      },
  { id: "heatmap",       icon: "map",                label: "Heatmap"       },
  { id: "allocation",    icon: "local_gas_station",  label: "Allocation"    },
  { id: "residents",     icon: "groups",             label: "Residents"     },
  { id: "stations",      icon: "store",              label: "Stations"      },
  { id: "transactions",  icon: "receipt_long",       label: "Transactions"  },
];

const fuelTypeStyle = (type) =>
  type === "Diesel"  ? { bg: "#fff3e0", color: "#e65100" }
  : type === "Premium" ? { bg: "#f3e5f5", color: "#7b1fa2" }
  :                      { bg: "#e8f5e9", color: "#2e7d32" };

const statusBadge = (s) =>
  s === "Maxed"   ? { bg: "#fce4ec", color: "#c62828" }
  : s === "New"   ? { bg: "#e8f5e9", color: "#2e7d32" }
  : s === "Online"? { bg: "#e8f5e9", color: "#2e7d32" }
  : s === "Offline"?{ bg: "#fce4ec", color: "#c62828" }
  :                 { bg: "#e3f2fd", color: "#1565c0" };

export default function AdminDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("overview");
  const [stationFilter, setStationFilter] = useState("All");
  const [heatmapFilter, setHeatmapFilter] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mapRef   = useRef(null);
  const mapInst  = useRef(null);

  const totalDispensed  = STATIONS.reduce((s, st) => s + st.dispensed,  0);
  const onlineStations  = STATIONS.filter(s => s.status === "Online").length;
  const maxedResidents  = RESIDENTS.filter(r => r.status === "Maxed").length;
  const weeklyQuota     = RESIDENTS.length * 20;
  const utilizationPct  = Math.round((totalDispensed / weeklyQuota) * 100);

  /* ── Mapbox init (heatmap page or overview) ── */
  useEffect(() => {
    if (activePage !== "heatmap" && activePage !== "overview") return;
    const el = mapRef.current;
    if (!el || mapInst.current) return;

    const map = new mapboxgl.Map({
      container: el,
      style:  "mapbox://styles/mapbox/light-v11",
      center: [123.9000, 10.3157],
      zoom:   11.5,
      interactive: true,
    });
    mapInst.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      const geojson = {
        type: "FeatureCollection",
        features: STATIONS.map(s => ({
          type: "Feature",
          properties: { name: s.name, brand: s.brand, dispensed: s.dispensed, intensity: s.dispensed / 1000 },
          geometry:   { type: "Point", coordinates: [s.lng, s.lat] },
        })),
      };

      map.addSource("stations", { type: "geojson", data: geojson });

      map.addLayer({
        id: "heat",
        type: "heatmap",
        source: "stations",
        paint: {
          "heatmap-weight":     ["interpolate", ["linear"], ["get", "intensity"], 0, 0, 6, 1],
          "heatmap-intensity":  ["interpolate", ["linear"], ["zoom"], 10, 1, 14, 2],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0,   "rgba(0,51,102,0)",
            0.2, "rgba(0,100,200,0.45)",
            0.5, "rgba(255,180,0,0.7)",
            0.8, "rgba(255,80,0,0.85)",
            1,   "rgba(200,20,20,1)",
          ],
          "heatmap-radius":  ["interpolate", ["linear"], ["zoom"], 10, 30, 14, 55],
          "heatmap-opacity": 0.78,
        },
      });

      map.addLayer({
        id: "circles",
        type: "circle",
        source: "stations",
        paint: {
          "circle-radius":       7,
          "circle-color":        "#003366",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("click", "circles", (e) => {
        const { name, brand, dispensed } = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates.slice();
        new mapboxgl.Popup({ offset: 12, closeButton: false })
          .setLngLat(coords)
          .setHTML(`
            <div style="font:13px/1.6 system-ui,sans-serif;min-width:160px">
              <strong style="color:#003366;display:block;margin-bottom:2px">${name}</strong>
              <span style="color:#888;font-size:11px">${brand}</span><br/>
              <span style="color:#e65100;font-weight:700">${dispensed.toLocaleString()} L dispensed</span>
            </div>`)
          .addTo(map);
      });

      map.on("mouseenter", "circles", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "circles", () => { map.getCanvas().style.cursor = ""; });
    });

    return () => { map.remove(); mapInst.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  /* ── Sync heatmap brand filter → Mapbox layer filter ── */
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !map.isStyleLoaded()) return;
    const f = heatmapFilter === "All" ? null : ["==", ["get", "brand"], heatmapFilter];
    if (map.getLayer("circles")) map.setFilter("circles", f);
    if (map.getLayer("heat"))    map.setFilter("heat",    f);
  }, [heatmapFilter]);

  const brandList        = ["All", ...Object.keys(BRAND_COLORS)];
  const filteredStations = stationFilter === "All" ? STATIONS : STATIONS.filter(s => s.brand === stationFilter);

  /* ── Sidebar nav item ── */
  const NavItem = ({ item }) => (
    <button
      onClick={() => setActivePage(item.id)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
        activePage === item.id
          ? "bg-[#003366] text-white"
          : "text-slate-500 hover:bg-slate-100 hover:text-[#003366]"
      }`}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "20px", fontVariationSettings: activePage === item.id ? "'FILL' 1" : "'FILL' 0" }}>
        {item.icon}
      </span>
      {sidebarOpen && <span>{item.label}</span>}
    </button>
  );

  /* ── Stat card ── */
  const StatCard = ({ icon, label, value, sub, iconColor }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${iconColor}18` }}>
        <span className="material-symbols-outlined" style={{ fontSize: "22px", color: iconColor, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
        <p className="text-2xl font-black font-headline text-[#003366] leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-1">{sub}</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden" style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* ═══ SIDEBAR ═══ */}
      <aside
        className="flex flex-col bg-white border-r border-slate-100 shadow-sm transition-all duration-200 shrink-0"
        style={{ width: sidebarOpen ? 220 : 68 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-[#003366] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-yellow-400" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>local_gas_station</span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-[#003366] font-black text-sm leading-tight truncate">Fuel Rationing</p>
              <p className="text-slate-400 text-[10px] font-medium">CMS Admin</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => <NavItem key={item.id} item={item} />)}
        </nav>

        {/* Collapse toggle + Logout */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-100 transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              {sidebarOpen ? "chevron_left" : "chevron_right"}
            </span>
            {sidebarOpen && <span>Collapse</span>}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-50 transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>logout</span>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-3.5 flex items-center justify-between shadow-sm shrink-0">
          <div>
            <h1 className="text-base font-black text-[#003366]">
              {NAV_ITEMS.find(n => n.id === activePage)?.label || "Overview"}
            </h1>
            <p className="text-xs text-slate-400">Cebu City Fuel Rationing System · March 30, 2026</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              System Live
            </span>
            <div className="w-9 h-9 rounded-full bg-[#003366] flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ══ OVERVIEW ══ */}
          {activePage === "overview" && (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard icon="groups"              label="Total Residents"   value={RESIDENTS.length}                           sub={`${maxedResidents} maxed their quota`}       iconColor="#003366" />
                <StatCard icon="store"               label="Active Stations"   value={`${onlineStations} / ${STATIONS.length}`}   sub={`${STATIONS.length - onlineStations} offline`} iconColor="#2e7d32" />
                <StatCard icon="local_fire_department" label="Total Dispensed" value={`${totalDispensed.toLocaleString()} L`}    sub="this week across all stations"               iconColor="#e65100" />
                <StatCard icon="bar_chart"           label="Quota Utilization" value={`${utilizationPct}%`}                        sub={`${(weeklyQuota - totalDispensed).toLocaleString()} L remaining`} iconColor="#7b1fa2" />
              </div>

              {/* Map + Allocation side by side */}
              <div className="grid grid-cols-5 gap-4">
                {/* Heatmap */}
                <div className="col-span-3 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                  <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-[#003366]">Station Heatmap</p>
                      <p className="text-xs text-slate-400">Fuel dispensing intensity across Cebu City</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                      <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Low
                      <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block ml-1" /> Mid
                      <span className="w-3 h-3 rounded-full bg-red-500 inline-block ml-1" /> High
                    </div>
                  </div>
                  <div ref={mapRef} style={{ height: 320 }} />
                </div>

                {/* Allocation breakdown */}
                <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-black text-[#003366]">Weekly Allocation</p>
                    <p className="text-xs text-slate-400">Quota consumed vs. remaining</p>
                  </div>

                  {/* Big donut-style indicator */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#003366" strokeWidth="4"
                          strokeDasharray={`${utilizationPct * 0.879} 87.9`}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-[#003366] leading-none">{utilizationPct}%</span>
                        <span className="text-[9px] text-slate-400 font-bold">used</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Dispensed</p>
                        <p className="text-base font-black text-[#003366]">{totalDispensed.toLocaleString()} L</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Remaining</p>
                        <p className="text-base font-black text-green-700">{(weeklyQuota - totalDispensed).toLocaleString()} L</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total Quota</p>
                        <p className="text-sm font-bold text-slate-600">{weeklyQuota.toLocaleString()} L</p>
                      </div>
                    </div>
                  </div>

                  {/* Brand bars */}
                  <div className="space-y-2.5">
                    {Object.entries(BRAND_COLORS).map(([brand, c]) => {
                      const tot = STATIONS.filter(s => s.brand === brand).reduce((a, s) => a + s.dispensed, 0);
                      const pct = Math.round((tot / totalDispensed) * 100);
                      return (
                        <div key={brand}>
                          <div className="flex justify-between text-xs font-bold mb-1" style={{ color: c.text }}>
                            <span>{brand}</span>
                            <span className="text-slate-400">{tot.toLocaleString()} L · {pct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.dot }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent transactions */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-black text-[#003366]">Recent Transactions</p>
                  <button onClick={() => setActivePage("transactions")} className="text-xs font-bold text-[#003366] hover:underline">View All</button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="text-left px-5 py-3">Resident</th>
                      <th className="text-left px-5 py-3">Station</th>
                      <th className="text-left px-5 py-3">Plate</th>
                      <th className="text-left px-5 py-3">Type</th>
                      <th className="text-right px-5 py-3">Liters</th>
                      <th className="text-right px-5 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_TXN.slice(0, 6).map((tx, i) => {
                      const ft = fuelTypeStyle(tx.type);
                      return (
                        <tr key={tx.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                          <td className="px-5 py-3 font-bold text-slate-800">{tx.resident}</td>
                          <td className="px-5 py-3 text-slate-500 text-xs">{tx.station}</td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-600">{tx.plate}</td>
                          <td className="px-5 py-3">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase" style={{ background: ft.bg, color: ft.color }}>{tx.type}</span>
                          </td>
                          <td className="px-5 py-3 text-right font-black text-[#003366]">{tx.liters.toFixed(1)} L</td>
                          <td className="px-5 py-3 text-right text-xs text-slate-400">{tx.date} · {tx.time}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ HEATMAP ══ */}
          {activePage === "heatmap" && (
            <div className="flex gap-4" style={{ height: "calc(100vh - 140px)" }}>

              {/* ── Map column ── */}
              <div className="flex-1 flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 min-w-0">
                {/* Header + legend */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div>
                    <p className="text-sm font-black text-[#003366]">Station Heatmap · Cebu City</p>
                    <p className="text-xs text-slate-400">Click a station marker for dispensing details</p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Low</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> Mid</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> High</span>
                  </div>
                </div>

                {/* Brand filter chips */}
                <div className="px-5 py-2.5 border-b border-slate-100 flex gap-2 shrink-0 overflow-x-auto">
                  {["All", ...Object.keys(BRAND_COLORS)].map(b => {
                    const bc = BRAND_COLORS[b];
                    const active = heatmapFilter === b;
                    return (
                      <button
                        key={b}
                        onClick={() => setHeatmapFilter(b)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                        style={active
                          ? { background: b === "All" ? "#003366" : bc.dot, color: "#fff", borderColor: b === "All" ? "#003366" : bc.dot }
                          : { background: "#fff", color: "#64748b", borderColor: "#e2e8f0" }}
                      >
                        {b !== "All" && (
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: active ? "#fff" : bc.dot }} />
                        )}
                        {b}
                      </button>
                    );
                  })}
                </div>

                {/* Map */}
                <div ref={mapRef} className="flex-1" />
              </div>

              {/* ── Brand stats panel ── */}
              <div className="w-64 flex flex-col gap-3 overflow-y-auto shrink-0">
                {/* Total card */}
                <div className="bg-[#003366] rounded-2xl p-4 shadow-sm">
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-wider mb-1">
                    {heatmapFilter === "All" ? "All Stations" : heatmapFilter} · Total Dispensed
                  </p>
                  <p className="text-3xl font-black text-white leading-none">
                    {(heatmapFilter === "All"
                      ? totalDispensed
                      : STATIONS.filter(s => s.brand === heatmapFilter).reduce((a, s) => a + s.dispensed, 0)
                    ).toLocaleString()}
                    <span className="text-lg text-yellow-400 ml-1">L</span>
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    {heatmapFilter === "All"
                      ? `${STATIONS.length} stations total`
                      : `${STATIONS.filter(s => s.brand === heatmapFilter).length} stations`}
                  </p>
                </div>

                {/* Per-brand cards */}
                {Object.entries(BRAND_COLORS).map(([brand, c]) => {
                  const brandStations = STATIONS.filter(s => s.brand === brand);
                  const brandTotal    = brandStations.reduce((a, s) => a + s.dispensed, 0);
                  const pct           = Math.round((brandTotal / totalDispensed) * 100);
                  const isActive      = heatmapFilter === brand;
                  return (
                    <button
                      key={brand}
                      onClick={() => setHeatmapFilter(isActive ? "All" : brand)}
                      className="w-full text-left rounded-2xl p-4 shadow-sm border-2 transition-all"
                      style={{
                        background:   isActive ? c.bg : "#fff",
                        borderColor:  isActive ? c.dot : "#f1f5f9",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: c.dot }} />
                          <span className="text-xs font-black" style={{ color: c.text }}>{brand}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{brandStations.length} stations</span>
                      </div>
                      <p className="text-xl font-black leading-none" style={{ color: c.text }}>
                        {(brandTotal / 1000).toFixed(1)}k L
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 mb-2">{brandTotal.toLocaleString()} liters dispensed</p>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.dot }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{pct}% of total dispensed</p>

                      {/* Individual stations */}
                      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2">
                        {brandStations.map(s => (
                          <div key={s.id} className="flex items-center justify-between">
                            <p className="text-[10px] text-slate-500 font-medium truncate flex-1 mr-2">{s.name.replace(`${brand} – `, "")}</p>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] font-bold" style={{ color: c.text }}>{s.dispensed.toLocaleString()} L</span>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.status === "Online" ? "bg-green-400" : "bg-red-400"}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ ALLOCATION ══ */}
          {activePage === "allocation" && (
            <div className="space-y-6">
              {/* Summary banner */}
              <div className="bg-[#003366] rounded-2xl p-6 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Total Fuel Dispensed This Week</p>
                  <p className="text-5xl font-black text-white font-headline leading-none">{totalDispensed.toLocaleString()} <span className="text-3xl text-yellow-400">L</span></p>
                  <p className="text-white/50 text-sm mt-2">of {weeklyQuota.toLocaleString()} L total weekly quota · {utilizationPct}% utilized</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Remaining</p>
                  <p className="text-4xl font-black text-green-300 font-headline">{(weeklyQuota - totalDispensed).toLocaleString()} L</p>
                </div>
              </div>

              {/* Per-station allocation table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-sm font-black text-[#003366]">Dispensing by Station</p>
                  <p className="text-xs text-slate-400">Weekly fuel consumption per gas station</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="text-left px-5 py-3">Station</th>
                      <th className="text-left px-5 py-3">Brand</th>
                      <th className="text-left px-5 py-3">Officer</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-right px-5 py-3">Dispensed</th>
                      <th className="text-left px-5 py-3 w-40">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STATIONS.map((s, i) => {
                      const pct = Math.min(Math.round((s.dispensed / (s.capacity * 0.1)) * 100), 100);
                      const bc  = BRAND_COLORS[s.brand] || { dot: "#999" };
                      const sb  = statusBadge(s.status);
                      return (
                        <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                          <td className="px-5 py-3 font-bold text-slate-800">{s.name}</td>
                          <td className="px-5 py-3">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: bc.bg || "#f5f5f5", color: bc.text || "#333" }}>{s.brand}</span>
                          </td>
                          <td className="px-5 py-3 text-slate-500 text-xs">{s.officer}</td>
                          <td className="px-5 py-3">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: sb.bg, color: sb.color }}>{s.status}</span>
                          </td>
                          <td className="px-5 py-3 text-right font-black text-[#003366]">{s.dispensed.toLocaleString()} L</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: bc.dot }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 w-8 shrink-0">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Resident allocation table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-sm font-black text-[#003366]">Resident Quota Usage</p>
                  <p className="text-xs text-slate-400">Individual weekly allocation status</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="text-left px-5 py-3">Resident</th>
                      <th className="text-left px-5 py-3">Plate</th>
                      <th className="text-left px-5 py-3">Barangay</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-right px-5 py-3">Used</th>
                      <th className="text-right px-5 py-3">Remaining</th>
                      <th className="text-left px-5 py-3 w-36">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RESIDENTS.map((r, i) => {
                      const pct = Math.round((r.used / 20) * 100);
                      const sb  = statusBadge(r.status);
                      return (
                        <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                          <td className="px-5 py-3 font-bold text-slate-800">{r.name}</td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-600">{r.plate}</td>
                          <td className="px-5 py-3 text-xs text-slate-500">{r.barangay}</td>
                          <td className="px-5 py-3">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: sb.bg, color: sb.color }}>{r.status}</span>
                          </td>
                          <td className="px-5 py-3 text-right font-black text-[#003366]">{r.used.toFixed(1)} L</td>
                          <td className="px-5 py-3 text-right font-bold text-green-700">{r.remaining.toFixed(1)} L</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? "#e53935" : pct >= 75 ? "#f57c00" : "#003366" }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 w-8 shrink-0">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ RESIDENTS ══ */}
          {activePage === "residents" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total",   value: RESIDENTS.length,                                          color: "#003366" },
                  { label: "Active",  value: RESIDENTS.filter(r => r.status === "Active").length,       color: "#1565c0" },
                  { label: "Maxed",   value: maxedResidents,                                            color: "#c62828" },
                  { label: "New",     value: RESIDENTS.filter(r => r.status === "New").length,          color: "#2e7d32" },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                    <p className="text-3xl font-black font-headline" style={{ color: c.color }}>{c.value}</p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">{c.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-sm font-black text-[#003366]">Resident Accounts</p>
                  <p className="text-xs text-slate-400">{RESIDENTS.length} registered residents</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="text-left px-5 py-3">Name</th>
                      <th className="text-left px-5 py-3">Plate</th>
                      <th className="text-left px-5 py-3">Vehicle</th>
                      <th className="text-left px-5 py-3">Barangay</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-right px-5 py-3">Used</th>
                      <th className="text-right px-5 py-3">Remaining</th>
                      <th className="text-left px-5 py-3 w-36">Quota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RESIDENTS.map((r, i) => {
                      const pct = Math.round((r.used / 20) * 100);
                      const sb  = statusBadge(r.status);
                      return (
                        <tr key={r.id} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-blue-50/30 transition-colors`}>
                          <td className="px-5 py-3 font-bold text-slate-800">{r.name}</td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-600 tracking-wider">{r.plate}</td>
                          <td className="px-5 py-3 text-xs text-slate-500">{r.vehicle}</td>
                          <td className="px-5 py-3 text-xs text-slate-500">{r.barangay}</td>
                          <td className="px-5 py-3">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: sb.bg, color: sb.color }}>{r.status}</span>
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-[#003366]">{r.used.toFixed(1)} L</td>
                          <td className="px-5 py-3 text-right font-bold text-green-700">{r.remaining.toFixed(1)} L</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? "#e53935" : pct >= 75 ? "#f57c00" : "#003366" }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 w-8 shrink-0">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ STATIONS ══ */}
          {activePage === "stations" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Stations",  value: STATIONS.length,       color: "#003366" },
                  { label: "Online",          value: onlineStations,         color: "#2e7d32" },
                  { label: "Offline",         value: STATIONS.length - onlineStations, color: "#c62828" },
                  { label: "Brands",          value: Object.keys(BRAND_COLORS).length, color: "#7b1fa2" },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                    <p className="text-3xl font-black font-headline" style={{ color: c.color }}>{c.value}</p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">{c.label}</p>
                  </div>
                ))}
              </div>

              {/* Brand filter */}
              <div className="flex gap-2">
                {brandList.map(b => (
                  <button key={b} onClick={() => setStationFilter(b)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      stationFilter === b ? "bg-[#003366] text-white border-[#003366]" : "bg-white text-slate-500 border-slate-200 hover:border-[#003366]/40"
                    }`}>
                    {b}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="text-left px-5 py-3">Station Name</th>
                      <th className="text-left px-5 py-3">Brand</th>
                      <th className="text-left px-5 py-3">Barangay</th>
                      <th className="text-left px-5 py-3">Officer</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-right px-5 py-3">Capacity</th>
                      <th className="text-right px-5 py-3">Dispensed</th>
                      <th className="text-left px-5 py-3 w-32">Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStations.map((s, i) => {
                      const pct = Math.min(Math.round((s.dispensed / (s.capacity * 0.1)) * 100), 100);
                      const bc  = BRAND_COLORS[s.brand] || { bg: "#f5f5f5", text: "#333", dot: "#999" };
                      const sb  = statusBadge(s.status);
                      return (
                        <tr key={s.id} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-blue-50/30 transition-colors`}>
                          <td className="px-5 py-3 font-bold text-slate-800">{s.name}</td>
                          <td className="px-5 py-3">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: bc.bg, color: bc.text }}>{s.brand}</span>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500">{s.barangay}</td>
                          <td className="px-5 py-3 text-xs text-slate-500">{s.officer}</td>
                          <td className="px-5 py-3">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: sb.bg, color: sb.color }}>{s.status}</span>
                          </td>
                          <td className="px-5 py-3 text-right text-xs text-slate-400">{(s.capacity / 1000).toFixed(0)}k L</td>
                          <td className="px-5 py-3 text-right font-black text-[#003366]">{s.dispensed.toLocaleString()} L</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: bc.dot }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 w-8 shrink-0">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ TRANSACTIONS ══ */}
          {activePage === "transactions" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Today's Total",  value: `${RECENT_TXN.filter(t => t.date === "Today").reduce((a, t) => a + t.liters, 0).toFixed(1)} L`, color: "#003366" },
                  { label: "Transactions",   value: RECENT_TXN.length,                                                                               color: "#1565c0" },
                  { label: "Avg per Fill",   value: `${(RECENT_TXN.reduce((a, t) => a + t.liters, 0) / RECENT_TXN.length).toFixed(1)} L`,            color: "#7b1fa2" },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                    <p className="text-3xl font-black font-headline" style={{ color: c.color }}>{c.value}</p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">{c.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-sm font-black text-[#003366]">All Transactions</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="text-left px-5 py-3">Resident</th>
                      <th className="text-left px-5 py-3">Station</th>
                      <th className="text-left px-5 py-3">Plate</th>
                      <th className="text-left px-5 py-3">Fuel Type</th>
                      <th className="text-right px-5 py-3">Liters</th>
                      <th className="text-right px-5 py-3">Date</th>
                      <th className="text-right px-5 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_TXN.map((tx, i) => {
                      const ft = fuelTypeStyle(tx.type);
                      return (
                        <tr key={tx.id} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-blue-50/30 transition-colors`}>
                          <td className="px-5 py-3 font-bold text-slate-800">{tx.resident}</td>
                          <td className="px-5 py-3 text-xs text-slate-500">{tx.station}</td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-600 tracking-wider">{tx.plate}</td>
                          <td className="px-5 py-3">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase" style={{ background: ft.bg, color: ft.color }}>{tx.type}</span>
                          </td>
                          <td className="px-5 py-3 text-right font-black text-[#003366]">{tx.liters.toFixed(1)} L</td>
                          <td className="px-5 py-3 text-right text-xs text-slate-400">{tx.date}</td>
                          <td className="px-5 py-3 text-right text-xs text-slate-400">{tx.time}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
