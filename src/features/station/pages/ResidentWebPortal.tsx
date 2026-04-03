import { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { encodeQR } from "../utils/qrCodec";

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

mapboxgl.accessToken =
  "pk.eyJ1IjoibWF0YWRldnMiLCJhIjoiY21mNmdhc3YyMGcxdzJrb21xZm80c3NpbCJ9.R0nU8Ip_9RCo-Q2aWxAbXA";

const NAV_ITEMS = [
  { id: "overview",      icon: "dashboard",       label: "Overview"         },
  { id: "qr-code",       icon: "qr_code",         label: "My QR Code"       },
  { id: "transactions",  icon: "receipt_long",    label: "Transactions"     },
  { id: "map",           icon: "map",             label: "Stations"         },
  { id: "account",       icon: "manage_accounts", label: "Account"          },
];

const TRANSACTIONS = [
  { id: 1, station: "Shell – Fuente Osmeña", date: "March 30, 2026", time: "10:24 AM", liters: 4.0, fuelType: "Regular", pricePerLiter: 62 },
  { id: 2, station: "Petron – Jones Ave",    date: "March 27, 2026", time: "09:45 AM", liters: 2.5, fuelType: "Regular", pricePerLiter: 62 },
  { id: 3, station: "Caltex – Mango Ave",    date: "March 24, 2026", time: "08:12 AM", liters: 1.5, fuelType: "Diesel",  pricePerLiter: 56 },
];

const mkFuels = (d: number, pd: number, r: number, p95: number, p97: number) => [
  { name: "Diesel",                price: d   },
  { name: "Premium Diesel",        price: pd  },
  { name: "Regular/Unleaded (91)", price: r   },
  { name: "Premium (95)",          price: p95 },
  { name: "Super Premium (97)",    price: p97 },
];

const ALL_STATIONS = [
  // Shell
  { id:  1, name: "Shell – Robinsons Galleria",    brand: "Shell",     barangay: "Ermita",         lat: 10.3062, lng: 123.8927, fuels: mkFuels(58.75,63.45,62.20,70.85,76.50) },
  { id:  2, name: "Shell – Osmeña / Jones Ave",    brand: "Shell",     barangay: "Lorega",         lat: 10.3058, lng: 123.8906, fuels: mkFuels(58.75,63.45,62.20,70.85,76.50) },
  { id:  3, name: "Shell – N. Escario St",         brand: "Shell",     barangay: "Camputhaw",      lat: 10.3188, lng: 123.9018, fuels: mkFuels(58.75,63.45,62.20,70.85,76.50) },
  { id:  4, name: "Shell – Gorordo Ave",           brand: "Shell",     barangay: "Lahug",          lat: 10.3252, lng: 123.9008, fuels: mkFuels(58.75,63.45,62.20,70.85,76.50) },
  { id:  5, name: "Shell – F. Cabahug St",         brand: "Shell",     barangay: "Kasambagan",     lat: 10.3425, lng: 123.9088, fuels: mkFuels(58.75,63.45,62.20,70.85,76.50) },
  { id:  6, name: "Shell – Banilad",               brand: "Shell",     barangay: "Banilad",        lat: 10.3512, lng: 123.8978, fuels: mkFuels(58.75,63.45,62.20,70.85,76.50) },
  { id:  7, name: "Shell – Talamban Highlands",    brand: "Shell",     barangay: "Talamban",       lat: 10.3682, lng: 123.9012, fuels: mkFuels(58.75,63.45,62.20,70.85,76.50) },
  { id:  8, name: "Shell – Katipunan St",          brand: "Shell",     barangay: "Labangon",       lat: 10.2898, lng: 123.8868, fuels: mkFuels(58.75,63.45,62.20,70.85,76.50) },
  { id:  9, name: "Shell – Basak Pardo",           brand: "Shell",     barangay: "Basak Pardo",    lat: 10.2842, lng: 123.8818, fuels: mkFuels(58.75,63.45,62.20,70.85,76.50) },
  { id: 10, name: "Shell – Mambaling",             brand: "Shell",     barangay: "Mambaling",      lat: 10.2958, lng: 123.8842, fuels: mkFuels(58.75,63.45,62.20,70.85,76.50) },
  { id: 11, name: "Shell – NRA",                   brand: "Shell",     barangay: "NRA",            lat: 10.3392, lng: 123.9072, fuels: mkFuels(58.75,63.45,62.20,70.85,76.50) },
  { id: 12, name: "Shell – MJ Cuenco Ave",         brand: "Shell",     barangay: "Carreta",        lat: 10.3098, lng: 123.8918, fuels: mkFuels(58.75,63.45,62.20,70.85,76.50) },
  { id: 13, name: "Shell – Talamban Rd (Upper)",   brand: "Shell",     barangay: "Talamban",       lat: 10.3722, lng: 123.9052, fuels: mkFuels(58.75,63.45,62.20,70.85,76.50) },
  // Petron
  { id: 14, name: "Petron – Pope John Paul II",    brand: "Petron",    barangay: "Apas",           lat: 10.3332, lng: 123.9058, fuels: mkFuels(58.50,63.10,61.95,70.60,76.15) },
  { id: 15, name: "Petron – N. Escario (Guadalupe)",brand:"Petron",    barangay: "Guadalupe",      lat: 10.3158, lng: 123.9002, fuels: mkFuels(58.50,63.10,61.95,70.60,76.15) },
  { id: 16, name: "Petron – F. Cabahug St",        brand: "Petron",    barangay: "Kasambagan",     lat: 10.3418, lng: 123.9072, fuels: mkFuels(58.50,63.10,61.95,70.60,76.15) },
  { id: 17, name: "Petron – R. Duterte St",        brand: "Petron",    barangay: "Banawa",         lat: 10.3042, lng: 123.8858, fuels: mkFuels(58.50,63.10,61.95,70.60,76.15) },
  { id: 18, name: "Petron – V Rama Ave",           brand: "Petron",    barangay: "Luz",            lat: 10.3082, lng: 123.9018, fuels: mkFuels(58.50,63.10,61.95,70.60,76.15) },
  { id: 19, name: "Petron – B. Rodriguez St",      brand: "Petron",    barangay: "Cogon Ramos",    lat: 10.3142, lng: 123.8968, fuels: mkFuels(58.50,63.10,61.95,70.60,76.15) },
  { id: 20, name: "Petron – South Cebu City",      brand: "Petron",    barangay: "Pardo",          lat: 10.2772, lng: 123.8778, fuels: mkFuels(58.50,63.10,61.95,70.60,76.15) },
  { id: 21, name: "Petron – Near Fuente",          brand: "Petron",    barangay: "Cogon Ramos",    lat: 10.3162, lng: 123.8942, fuels: mkFuels(58.50,63.10,61.95,70.60,76.15) },
  { id: 22, name: "Petron – Punta Princesa",       brand: "Petron",    barangay: "Punta Princesa", lat: 10.2882, lng: 123.8862, fuels: mkFuels(58.50,63.10,61.95,70.60,76.15) },
  { id: 23, name: "Petron – Tisa",                 brand: "Petron",    barangay: "Tisa",           lat: 10.2942, lng: 123.8868, fuels: mkFuels(58.50,63.10,61.95,70.60,76.15) },
  // Caltex
  { id: 24, name: "Caltex – Landers Cebu",         brand: "Caltex",    barangay: "Apas",           lat: 10.3352, lng: 123.9038, fuels: mkFuels(58.60,63.25,62.05,70.70,76.30) },
  { id: 25, name: "Caltex – T. Padilla / MJ Cuenco",brand:"Caltex",   barangay: "Carreta",        lat: 10.3082, lng: 123.8898, fuels: mkFuels(58.60,63.25,62.05,70.70,76.30) },
  { id: 26, name: "Caltex – Magallanes St",        brand: "Caltex",    barangay: "Parian",         lat: 10.3022, lng: 123.8878, fuels: mkFuels(58.60,63.25,62.05,70.70,76.30) },
  { id: 27, name: "Caltex – Cebu South Rd",        brand: "Caltex",    barangay: "Basak",          lat: 10.2832, lng: 123.8828, fuels: mkFuels(58.60,63.25,62.05,70.70,76.30) },
  { id: 28, name: "Caltex – Filimon Sotto Dr",     brand: "Caltex",    barangay: "Cogon Ramos",    lat: 10.3172, lng: 123.8938, fuels: mkFuels(58.60,63.25,62.05,70.70,76.30) },
  { id: 29, name: "Caltex – Tres de Abril St",     brand: "Caltex",    barangay: "Punta Princesa", lat: 10.2872, lng: 123.8850, fuels: mkFuels(58.60,63.25,62.05,70.70,76.30) },
  // Phoenix
  { id: 30, name: "Phoenix – Banilad",             brand: "Phoenix",   barangay: "Banilad",        lat: 10.3502, lng: 123.8968, fuels: mkFuels(57.90,62.50,61.40,69.95,75.60) },
  { id: 31, name: "Phoenix – Mambaling",           brand: "Phoenix",   barangay: "Mambaling",      lat: 10.2952, lng: 123.8832, fuels: mkFuels(57.90,62.50,61.40,69.95,75.60) },
  // Sea Oil
  { id: 32, name: "SEAOIL – Tres de Abril St",     brand: "Sea Oil",   barangay: "Punta Princesa", lat: 10.2862, lng: 123.8840, fuels: mkFuels(57.75,62.30,61.25,69.75,75.40) },
  { id: 33, name: "SeaOil – Bacalso Ave",          brand: "Sea Oil",   barangay: "Duljo-Fatima",   lat: 10.2922, lng: 123.8808, fuels: mkFuels(57.75,62.30,61.25,69.75,75.40) },
  // Flying V
  { id: 34, name: "Flying V – Pit-os",             brand: "Flying V",  barangay: "Pit-os",         lat: 10.3802, lng: 123.9022, fuels: mkFuels(57.50,62.00,60.95,69.50,75.10) },
  { id: 35, name: "Flying V – Quiot Pardo",        brand: "Flying V",  barangay: "Quiot Pardo",    lat: 10.2732, lng: 123.8798, fuels: mkFuels(57.50,62.00,60.95,69.50,75.10) },
  // Diatoms
  { id: 36, name: "Diatoms – Tisa",                brand: "Diatoms",   barangay: "Tisa",           lat: 10.2952, lng: 123.8875, fuels: mkFuels(57.40,61.90,60.85,69.40,75.00) },
  { id: 37, name: "Diatoms – P. Del Rosario St",   brand: "Diatoms",   barangay: "Pahina Central", lat: 10.3022, lng: 123.8918, fuels: mkFuels(57.40,61.90,60.85,69.40,75.00) },
  // Other / Independent
  { id: 38, name: "Fueltech – Tinago",             brand: "Other",     barangay: "Tinago",         lat: 10.3062, lng: 123.8888, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 39, name: "Unioil – Lahug",                brand: "Other",     barangay: "Lahug",          lat: 10.3242, lng: 123.9018, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 40, name: "Total – Basak Pardo",           brand: "Other",     barangay: "Basak Pardo",    lat: 10.2802, lng: 123.8808, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 41, name: "Rephil – Pardo",                brand: "Other",     barangay: "Pardo",          lat: 10.2812, lng: 123.8788, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 42, name: "Triune – Sudlon",               brand: "Other",     barangay: "Sudlon",         lat: 10.3902, lng: 123.8958, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 43, name: "C3 Fuels – Labangon",           brand: "Other",     barangay: "Labangon",       lat: 10.2892, lng: 123.8868, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 44, name: "Geminie – Talamban",            brand: "Other",     barangay: "Talamban",       lat: 10.3702, lng: 123.9028, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 45, name: "Gas Up – Cebu South Rd",        brand: "Other",     barangay: "Quiot Pardo",    lat: 10.2752, lng: 123.8828, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 46, name: "JSY – Kalunasan",               brand: "Other",     barangay: "Kalunasan",      lat: 10.3082, lng: 123.8858, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 47, name: "SGD – Sirao / Busay",           brand: "Other",     barangay: "Sirao",          lat: 10.3982, lng: 123.8848, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 48, name: "2010 Gas – Busay",              brand: "Other",     barangay: "Busay",          lat: 10.3952, lng: 123.8818, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 49, name: "LKB – Sudlon / TCH",            brand: "Other",     barangay: "Sudlon",         lat: 10.3922, lng: 123.8878, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 50, name: "SALLEVER – Agsungot",           brand: "Other",     barangay: "Agsungot",       lat: 10.4052, lng: 123.8788, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 51, name: "Cogon Gas Station",             brand: "Other",     barangay: "Cogon Pardo",    lat: 10.2802, lng: 123.8868, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 52, name: "Aura Fuels – V Rama Ave",       brand: "Other",     barangay: "Luz",            lat: 10.3058, lng: 123.8958, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 53, name: "Light Fuels – NRA",             brand: "Other",     barangay: "NRA",            lat: 10.3452, lng: 123.9078, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
  { id: 54, name: "Oh My Gas – Talamban",          brand: "Other",     barangay: "Talamban",       lat: 10.3732, lng: 123.9038, fuels: mkFuels(57.25,61.75,60.70,69.25,74.85) },
];

const FUEL_BADGE: Record<string, string> = {
  Regular: "bg-blue-100 text-blue-700",
  Diesel:  "bg-amber-100 text-amber-700",
  Premium: "bg-green-100 text-green-700",
};

export default function ResidentWebPortal({ resident, onLogout }) {
  const [activePage, setActivePage]     = useState("overview");
  const [collapsed, setCollapsed]       = useState(false);
  const [txFilter, setTxFilter]         = useState("All");
  const [brandFilter, setBrandFilter]           = useState("All");
  const [selectedStation, setSelectedStation]   = useState<typeof ALL_STATIONS[0] | null>(null);
  const mapRef                          = useRef<HTMLDivElement>(null);
  const mapInst                         = useRef<mapboxgl.Map | null>(null);
  const markerEls                       = useRef<Record<number, HTMLElement>>({});
  const stationListRef                  = useRef<HTMLDivElement>(null);
  const stationRowRefs                  = useRef<Record<number, HTMLElement | null>>({});
  const qrRef                           = useRef<HTMLDivElement>(null);
  const webCaptureRef                   = useRef<HTMLDivElement>(null);

  const firstName    = resident?.firstName || "Resident";
  const lastName     = resident?.lastName  || "";
  const fullName     = `${firstName} ${lastName}`.trim();
  const plate        = resident?.plate        || "N/A";
  const barangay     = resident?.barangay     || "Not set";
  const vehicleType  = resident?.vehicleType  || "Car";
  const gasType      = resident?.gasType      || "Regular";
  const registeredAt = resident?.registeredAt || new Date().toISOString();
  const initials     = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  const remaining    = resident?.remaining ?? 12.0;
  const weeklyQuota  = 20;
  const used         = weeklyQuota - remaining;
  const pct          = Math.round((remaining / weeklyQuota) * 100);
  const totalSpent   = TRANSACTIONS.reduce((s, t) => s + t.liters * t.pricePerLiter, 0);

  const qrData = encodeQR(firstName, lastName, registeredAt, gasType);
  const circumference = 2 * Math.PI * 22;

  /* ── Map (All Stations page) ── */
  useEffect(() => {
    if (activePage !== "map") return;
    const el = mapRef.current;
    if (!el || mapInst.current) return;

    const map = new mapboxgl.Map({
      container: el,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [123.8950, 10.3200],
      zoom: 11.5,
      fadeDuration: 0,
    });
    mapInst.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      ALL_STATIONS.forEach((st) => {
        const markerEl = document.createElement("div");
        markerEl.style.cssText =
          "width:32px;height:32px;border-radius:50%;background:#003366;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;";
        markerEl.innerHTML = `<span class="material-symbols-outlined" style="color:#f9c23c;font-size:16px;font-variation-settings:'FILL' 1">local_gas_station</span>`;
        markerEl.addEventListener("click", () => {
          setSelectedStation(st);
          map.flyTo({ center: [st.lng, st.lat], zoom: 14, duration: 600 });
        });

        markerEls.current[st.id] = markerEl;

        new mapboxgl.Marker({ element: markerEl })
          .setLngLat([st.lng, st.lat])
          .addTo(map);
      });
    });

    return () => { map.remove(); mapInst.current = null; markerEls.current = {}; };
  }, [activePage]);

  /* ── Sync marker colors + auto-scroll list when selectedStation changes ── */
  useEffect(() => {
    ALL_STATIONS.forEach((st) => {
      const el = markerEls.current[st.id];
      if (!el) return;
      const isActive = selectedStation?.id === st.id;
      el.style.background = isActive ? "#f9c23c" : "#003366";
      const icon = el.querySelector("span");
      if (icon) (icon as HTMLElement).style.color = isActive ? "#003366" : "#f9c23c";
    });

    if (!selectedStation) return;
    const listEl = stationListRef.current;
    const rowEl = stationRowRefs.current[selectedStation.id];
    if (!listEl || !rowEl) return;
    const offset = rowEl.getBoundingClientRect().top - listEl.getBoundingClientRect().top + listEl.scrollTop - 8;
    listEl.scrollTo({ top: offset, behavior: "smooth" });
  }, [selectedStation]);

  /* ── Filter map markers by brand ── */
  useEffect(() => {
    ALL_STATIONS.forEach((st) => {
      const el = markerEls.current[st.id];
      if (!el) return;
      el.style.display = (brandFilter === "All" || st.brand === brandFilter) ? "flex" : "none";
    });
  }, [brandFilter]);

  /* ── Download QR ── */
  const handleDownloadQR = async () => {
    if (!webCaptureRef.current) return;
    const canvas = await html2canvas(webCaptureRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const url = canvas.toDataURL("image/png");
    const a   = document.createElement("a");
    a.href = url; a.download = `AGAS_QR_${plate}.png`; a.click();
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden">

      {/* ── Hidden branded capture card (used for Download QR) ── */}
      <div
        ref={webCaptureRef}
        style={{ position: "fixed", top: "-9999px", left: 0, width: 420, background: "#ffffff", fontFamily: "sans-serif" }}
      >
        {/* Navy header */}
        <div style={{ background: "#001e40", padding: "22px 28px", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", margin: "0 0 6px" }}>A.G.A.S · Gas Allocation QR</p>
          <p style={{ color: "#ffffff", fontWeight: 900, fontSize: 32, letterSpacing: 6, textTransform: "uppercase", margin: 0 }}>{plate}</p>
          {gasType && (
            <p style={{ color: "#fde047", fontWeight: 700, fontSize: 13, marginTop: 8, marginBottom: 0 }}>⛽ {gasType}</p>
          )}
        </div>
        {/* QR + info */}
        <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <QRCodeSVG value={qrData} size={300} level="H" marginSize={2} fgColor="#001e40" bgColor="#ffffff" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
            {[
              { label: "Full Name",  value: fullName },
              { label: "Plate No.", value: plate },
              { label: "Vehicle",   value: vehicleType },
              { label: "Barangay",  value: barangay },
              { label: "Fuel Type", value: gasType },
              { label: "Registered", value: formatTimestamp(registeredAt) },
            ].map((d) => (
              <div key={d.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px" }}>
                <p style={{ fontSize: 8, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 2px" }}>{d.label}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#001e40", margin: 0 }}>{d.value}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Footer */}
        <div style={{ background: "#f1f5f9", padding: "10px 28px", textAlign: "center", borderTop: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>© 2026 Mata Technologies Inc. · A.G.A.S — Access to Goods and Assistance System</p>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col bg-[#003366] shadow-xl transition-all duration-300 shrink-0 ${
          collapsed ? "w-[68px]" : "w-[240px]"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-yellow-400 rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#003366] icon-fill text-[20px]">local_gas_station</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white font-black font-headline text-base leading-none tracking-wide">A.G.A.S</p>
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mt-0.5">Resident Portal</p>
            </div>
          )}
        </div>

        {/* Resident profile */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-white/10 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm">{initials}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-sm font-bold leading-none truncate">{fullName}</p>
              <p className="text-white/50 text-[10px] mt-0.5 truncate">{plate} · {vehicleType}</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] shrink-0 ${active ? "icon-fill" : ""}`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="text-sm font-semibold truncate">{item.label}</span>
                )}
                {!collapsed && active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse + Sign out */}
        <div className="border-t border-white/10 px-2 py-3 space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
            {!collapsed && <span className="text-sm font-semibold">Collapse</span>}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
            {!collapsed && <span className="text-sm font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
          <div>
            <h1 className="text-[#003366] font-headline font-black text-lg leading-none">
              {NAV_ITEMS.find(n => n.id === activePage)?.label}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Cebu City A.G.A.S · Resident Portal</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── OVERVIEW ── */}
          {activePage === "overview" && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Remaining Fuel", value: `${remaining.toFixed(1)} L`, icon: "local_gas_station", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
                  { label: "Used This Week",  value: `${used.toFixed(1)} L`,      icon: "ev_station",        color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
                  { label: "Allocation Used", value: `${100 - pct}%`,             icon: "donut_large",       color: "text-[#003366]",  bg: "bg-blue-50",   border: "border-blue-200" },
                  { label: "Total Spent",     value: `₱${totalSpent.toFixed(0)}`, icon: "payments",          color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
                ].map((c) => (
                  <div key={c.label} className={`${c.bg} border ${c.border} rounded-2xl p-4 flex items-center gap-4`}>
                    <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined icon-fill ${c.color} text-[22px]`}>{c.icon}</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{c.label}</p>
                      <p className={`text-2xl font-black font-headline ${c.color}`}>{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Two-column */}
              <div className="grid grid-cols-3 gap-5">

                {/* Recent Transactions (2/3) */}
                <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h3 className="font-headline font-bold text-[#003366]">Recent Fuel Activity</h3>
                    <button onClick={() => setActivePage("transactions")} className="text-xs font-bold text-[#003366] hover:underline">
                      View All
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {TRANSACTIONS.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-10 h-10 rounded-xl bg-[#003366] flex items-center justify-center shrink-0">
                          <span className="text-white font-black text-sm">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{fullName}</p>
                          <p className="text-xs text-slate-400">{plate} · {tx.date} · {tx.time}</p>
                          <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${FUEL_BADGE[tx.fuelType] ?? "bg-slate-100 text-slate-600"}`}>
                            {tx.fuelType}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-black text-slate-800">{tx.liters.toFixed(1)} L</p>
                          <p className="text-xs text-slate-400">₱{tx.pricePerLiter}/L</p>
                          <p className="text-sm font-black text-[#003366]">₱{(tx.liters * tx.pricePerLiter).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Allocation ring (1/3) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col items-center justify-center gap-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Weekly Allocation</p>
                  <div className="relative w-36 h-36">
                    <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                      <circle cx="28" cy="28" r="22" fill="none"
                        stroke="#2e7d32" strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - pct / 100)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-[#003366]">{pct}%</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Left</span>
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Remaining</span>
                      <span className="font-black text-green-700">{remaining.toFixed(1)} L</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Used</span>
                      <span className="font-black text-orange-600">{used.toFixed(1)} L</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-slate-100 pt-2">
                      <span className="text-slate-500 font-medium">Weekly Total</span>
                      <span className="font-black text-slate-700">{weeklyQuota} L</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActivePage("qr-code")}
                    className="w-full bg-[#003366] text-white font-bold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#00254d] transition-colors"
                  >
                    <span className="material-symbols-outlined icon-fill text-[18px]">qr_code</span>
                    View My QR Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── MY QR CODE ── */}
          {activePage === "qr-code" && (
            <div className="max-w-5xl mx-auto">
              {/* Navy banner */}
              <div className="bg-[#003366] rounded-2xl px-8 py-4 mb-4 flex items-center justify-between shadow-lg">
                <div>
                  <h2 className="font-headline font-black text-white text-3xl tracking-[0.12em] uppercase leading-none">{plate}</h2>
                  {gasType && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="material-symbols-outlined text-yellow-300 icon-fill text-[16px]">local_gas_station</span>
                      <p className="text-white/80 font-bold text-sm tracking-wide">{gasType}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1.5 rounded-full border border-green-400/30">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    Active · Verified
                  </span>
                </div>
              </div>

              {/* Two-column */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left — QR code */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col items-center gap-3 self-start">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scan at participating stations</p>
                  <div ref={qrRef} className="bg-white rounded-2xl border border-slate-100 shadow-inner p-4">
                    <QRCodeSVG value={qrData} size={200} level="H" marginSize={0} fgColor="#001e40" bgColor="#ffffff" />
                  </div>
                  <button
                    onClick={handleDownloadQR}
                    className="w-full bg-[#003366] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#00254d] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download QR Code
                  </button>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 px-3 py-2.5 rounded-r-xl flex gap-2 items-start w-full">
                    <span className="material-symbols-outlined text-yellow-600 text-[14px] shrink-0 mt-0.5">info</span>
                    <p className="text-[11px] text-yellow-800 leading-relaxed">
                      Present this QR code at any participating A.G.A.S gas station for fuel allocation dispensing.
                    </p>
                  </div>
                </div>

                {/* Right — Details */}
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resident Information</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {[
                        { icon: "person",           label: "Full Name",    value: fullName    },
                        { icon: "directions_car",   label: "Plate No.",    value: plate       },
                        { icon: "commute",          label: "Vehicle Type", value: vehicleType },
                        { icon: "location_on",      label: "Barangay",     value: barangay    },
                        { icon: "local_gas_station",label: "Fuel Type",    value: gasType     },
                      ].map((d) => (
                        <div key={d.label} className="flex items-center gap-4 px-5 py-2.5">
                          <span className="material-symbols-outlined text-[#003366] text-[18px] shrink-0">{d.icon}</span>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d.label}</p>
                            <p className="text-sm font-bold text-slate-800">{d.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Allocation summary */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Fuel Allocation</p>
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 shrink-0">
                        <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                          <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                          <circle cx="28" cy="28" r="22" fill="none" stroke="#2e7d32" strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - pct / 100)}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-black text-[#003366]">{pct}%</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Left</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Remaining</span>
                          <span className="font-black text-green-700">{remaining.toFixed(1)} L</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Used</span>
                          <span className="font-black text-orange-600">{used.toFixed(1)} L</span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-2">
                          <span className="text-slate-500">Weekly Quota</span>
                          <span className="font-black text-slate-700">{weeklyQuota} L</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TRANSACTIONS ── */}
          {activePage === "transactions" && (
            <div className="max-w-4xl mx-auto space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Dispensed",  value: `${TRANSACTIONS.reduce((s,t)=>s+t.liters,0).toFixed(1)} L`, color: "text-[#003366]", bg: "bg-blue-50 border-blue-200" },
                  { label: "Transactions",      value: TRANSACTIONS.length,                                          color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
                  { label: "Total Spent",       value: `₱${totalSpent.toFixed(2)}`,                                 color: "text-green-700",  bg: "bg-green-50 border-green-200" },
                ].map((c) => (
                  <div key={c.label} className={`border rounded-2xl p-5 ${c.bg}`}>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{c.label}</p>
                    <p className={`text-3xl font-black font-headline mt-1 ${c.color}`}>{c.value}</p>
                  </div>
                ))}
              </div>

              {/* Filter */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                  {["All", "Today", "Week", "Month"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setTxFilter(f)}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                        txFilter === f
                          ? "bg-[#003366] text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {/* Table header */}
                <div className="grid grid-cols-6 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="col-span-2">Station</span>
                  <span>Date & Time</span>
                  <span>Fuel Type</span>
                  <span className="text-right">Liters</span>
                  <span className="text-right">Total</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {TRANSACTIONS.map((tx) => (
                    <div key={tx.id} className="grid grid-cols-6 px-5 py-4 items-center hover:bg-slate-50 transition-colors">
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#003366] flex items-center justify-center shrink-0">
                          <span className="text-white font-black text-xs">{initials}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{tx.station}</p>
                          <p className="text-xs text-slate-400">{fullName}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 font-medium">{tx.date}</p>
                        <p className="text-xs text-slate-400">{tx.time}</p>
                      </div>
                      <div>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${FUEL_BADGE[tx.fuelType] ?? "bg-slate-100 text-slate-600"}`}>
                          {tx.fuelType}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">₱{tx.pricePerLiter}/L</p>
                      </div>
                      <p className="text-right text-sm font-bold text-slate-700">{tx.liters.toFixed(1)} L</p>
                      <p className="text-right text-sm font-black text-[#003366]">₱{(tx.liters * tx.pricePerLiter).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ALL STATIONS ── */}
          {activePage === "map" && (() => {
            const brands = ["All", "Shell", "Petron", "Caltex", "Phoenix", "Sea Oil", "Flying V", "Diatoms", "Other"];
            const filtered = brandFilter === "All" ? ALL_STATIONS : ALL_STATIONS.filter(s => s.brand === brandFilter);
            return (
              <div className="max-w-7xl mx-auto h-full">
                <div className="grid grid-cols-3 gap-5 h-[calc(100vh-160px)]">
                  {/* Map */}
                  <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <div ref={mapRef} className="w-full h-full" />
                    {/* Station modal card */}
                    {selectedStation && (
                      <div className="absolute bottom-4 left-4 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10">
                        <div className="bg-[#003366] px-4 py-3 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-white font-bold text-sm leading-tight">{selectedStation.name}</p>
                            <p className="text-white/60 text-xs mt-0.5">{selectedStation.barangay}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedStation(null)}
                            className="text-white/60 hover:text-white mt-0.5 shrink-0"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                        <div className="px-4 py-3 space-y-1.5">
                          {selectedStation.fuels.map((fuel) => (
                            <div key={fuel.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#003366] shrink-0" />
                                <span className="text-xs text-slate-600">{fuel.name}</span>
                              </div>
                              <span className="text-xs font-black text-[#003366]">₱{fuel.price.toFixed(2)}<span className="text-[10px] font-normal text-slate-400">/L</span></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Station list */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <h3 className="font-headline font-bold text-[#003366]">Gas Stations – Cebu City</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{filtered.length} of {ALL_STATIONS.length} stations</p>
                      {/* Brand filter */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {brands.map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => { setBrandFilter(b); setSelectedStation(null); }}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                              brandFilter === b
                                ? "bg-[#003366] text-white"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div ref={stationListRef} className="flex-1 overflow-y-auto">
                      {filtered.map((st) => {
                        const isSelected = selectedStation?.id === st.id;
                        return (
                          <button
                            key={st.id}
                            ref={(el) => { stationRowRefs.current[st.id] = el; }}
                            type="button"
                            onClick={() => {
                              setSelectedStation(st);
                              mapInst.current?.flyTo({ center: [st.lng, st.lat], zoom: 14, duration: 600 });
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 text-left ${
                              isSelected ? "bg-[#003366]" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-white/15" : "bg-slate-100"}`}>
                              <span className={`material-symbols-outlined icon-fill text-[15px] ${isSelected ? "text-yellow-400" : "text-[#003366]"}`}>local_gas_station</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-slate-800"}`}>{st.name}</p>
                              <p className={`text-[10px] ${isSelected ? "text-white/60" : "text-slate-400"}`}>{st.barangay}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── ACCOUNT ── */}
          {activePage === "account" && (
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Profile card */}
              <div className="bg-[#003366] rounded-2xl p-6 flex items-center gap-5 shadow-lg">
                <div className="w-16 h-16 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-2xl">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-headline font-black text-xl leading-tight">{fullName}</p>
                  <p className="text-white/60 text-sm mt-0.5">{plate} · {vehicleType}</p>
                  <p className="text-white/50 text-xs mt-0.5">{barangay} · {gasType}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1 rounded-full border border-green-400/30">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    Active
                  </span>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Full Name",    value: fullName,     icon: "person"         },
                  { label: "Plate No.",    value: plate,        icon: "directions_car"  },
                  { label: "Barangay",     value: barangay,     icon: "location_on"     },
                  { label: "Vehicle Type", value: vehicleType,  icon: "commute"         },
                  { label: "Fuel Type",    value: gasType,      icon: "local_gas_station" },
                  { label: "Status",       value: "Active",     icon: "verified_user"   },
                ].map((d) => (
                  <div key={d.label} className="bg-white rounded-2xl px-5 py-4 border border-slate-200 shadow-sm flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#003366] text-[20px] shrink-0">{d.icon}</span>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d.label}</p>
                      <p className="text-sm font-bold text-slate-800">{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {[
                  { icon: "qr_code",      label: "View My QR Code",  action: () => setActivePage("qr-code"), color: "text-[#003366]" },
                  { icon: "receipt_long", label: "Transaction History", action: () => setActivePage("transactions"), color: "text-[#003366]" },
                  { icon: "smartphone",   label: "Software Version",  action: null, note: "V 1.0.0", color: "text-[#003366]" },
                ].map((item, i, arr) => (
                  <button
                    key={item.label}
                    onClick={item.action ?? undefined}
                    disabled={!item.action}
                    className={`w-full flex items-center gap-4 px-5 py-4 transition-colors ${i < arr.length - 1 ? "border-b border-slate-100" : ""} ${item.action ? "hover:bg-slate-50 active:bg-slate-100" : "cursor-default"}`}
                  >
                    <span className={`material-symbols-outlined text-[22px] ${item.color}`}>{item.icon}</span>
                    <span className="flex-1 text-sm font-medium text-slate-800 text-left">{item.label}</span>
                    {item.note
                      ? <span className="text-sm font-bold text-slate-400">{item.note}</span>
                      : <span className="material-symbols-outlined text-slate-300 text-[20px]">chevron_right</span>
                    }
                  </button>
                ))}
              </div>

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 font-bold py-3.5 rounded-2xl hover:bg-red-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Sign Out
              </button>

              <p className="text-center text-slate-300 text-[10px] pb-2">
                © 2026 Mata Technologies Inc. · A.G.A.S
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

