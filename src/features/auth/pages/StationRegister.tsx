import { useState, useMemo, useRef, useEffect, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { AuthUser } from "@/lib/auth/authService";
import { auth, db } from "@/lib/firebase/client";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

// Official 80 barangays of Cebu City
const CEBU_BARANGAYS = [
  "Adlaon", "Agsungot", "Apas", "Babag", "Bacayan", "Banilad",
  "Basak Pardo", "Basak San Nicolas", "Binaliw", "Budlaan", "Buhisan",
  "Bulacao", "Buot-Taup Pardo", "Busay", "Calamba", "Cambinocot",
  "Camputhaw", "Capitol Site", "Carreta", "Central Poblacion",
  "Cogon Pardo", "Cogon Ramos", "Day-as", "Duljo", "Ermita",
  "Guadalupe", "Guba", "Hipodromo", "Inayawan", "Kalubihan",
  "Kalunasan", "Kamagayan", "Kasambagan", "Kinasang-an Pardo",
  "Labangon", "Lahug", "Lorega San Miguel", "Lusaran", "Luz",
  "Mabini", "Mabolo", "Malubog", "Manipis", "Nasipit", "Nga-an",
  "Nivel Hills", "Non-oc", "Pari-an", "Pasil", "Pit-os",
  "Poblacion Pardo", "Pulangbato", "Pung-ol Sibugay", "Punta Princesa",
  "Quiot Pardo", "Ramos", "San Antonio", "San Jose", "San Nicolas Proper",
  "San Roque", "Santa Cruz", "Santa Lucia", "Santo Niño", "Sapangdaku",
  "Sawang Calero", "Sinsin", "Sirao", "Sudlon I", "Sudlon II",
  "T. Padilla", "Tabunan", "Tagbao", "Talamban", "Taptap", "Tejero",
  "Tinago", "Tisa", "To-ong Pardo", "Tugbongan", "Zapatera",
];

const BRANDS = ["Default", "Shell", "Petron", "Caltex", "Phoenix"];

const BRAND_FUELS = {
  Default: ["Diesel", "Premium Diesel", "Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)", "Kerosene"],
  Caltex:  ["Diesel", "Premium Diesel", "Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)", "Kerosene"],
  Petron:  ["Diesel", "Premium Diesel", "Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)", "Kerosene"],
  Phoenix: ["Diesel", "Premium Diesel", "Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)", "Kerosene"],
  Shell:   ["Diesel", "Premium Diesel", "Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)", "Kerosene"],
};

type Brand = keyof typeof BRAND_FUELS;

/** Solid header colors per fuel — aligned with station fuel inventory cards */
function getFuelCardTheme(fuel: string): { card: string; iconWrap: string } {
  const n = fuel.toLowerCase();
  if (n.includes("kerosene")) {
    return {
      card: "bg-violet-600 border-violet-700/60 shadow-[0_4px_16px_rgba(124,58,237,0.35)]",
      iconWrap: "bg-violet-500/35 ring-1 ring-white/20",
    };
  }
  if (n.includes("super premium")) {
    return {
      card: "bg-blue-700 border-blue-800/60 shadow-[0_4px_16px_rgba(29,78,216,0.35)]",
      iconWrap: "bg-blue-600/35 ring-1 ring-white/20",
    };
  }
  if (n.includes("premium diesel")) {
    return {
      card: "bg-emerald-600 border-emerald-700/60 shadow-[0_4px_16px_rgba(5,150,105,0.35)]",
      iconWrap: "bg-emerald-500/35 ring-1 ring-white/20",
    };
  }
  if (n.includes("(95)") || n.includes("premium (95)")) {
    return {
      card: "bg-red-600 border-red-700/60 shadow-[0_4px_16px_rgba(220,38,38,0.35)]",
      iconWrap: "bg-red-500/35 ring-1 ring-white/20",
    };
  }
  if (n.includes("regular") || n.includes("unleaded")) {
    return {
      card: "bg-amber-600 border-amber-700/60 shadow-[0_4px_16px_rgba(217,119,6,0.35)]",
      iconWrap: "bg-amber-500/35 ring-1 ring-white/25",
    };
  }
  if (n.includes("diesel")) {
    return {
      card: "bg-[#546e7a] border-[#455a64]/80 shadow-[0_4px_16px_rgba(69,90,100,0.35)]",
      iconWrap: "bg-white/15 ring-1 ring-white/20",
    };
  }
  return {
    card: "bg-slate-600 border-slate-700/60 shadow-md",
    iconWrap: "bg-white/15 ring-1 ring-white/20",
  };
}

type StationForm = {
  barangay: string;
  brand: Brand | "";
  officerFirstName: string;
  officerLastName: string;
  googleEmail: string;
  password: string;
  confirmPassword: string;
  lat: number | null;
  lon: number | null;
};

// ── Barangay centre coordinates (verified against OSM/Google Maps) ────────────
const BARANGAY_COORDS: Record<string, [number, number]> = {
  "Adlaon":              [10.3978, 123.8542], "Agsungot":          [10.3867, 123.8614],
  "Apas":                [10.3325, 123.9085], "Babag":             [10.2648, 123.8471],
  "Bacayan":             [10.3388, 123.8952], "Banilad":           [10.3410, 123.9008],
  "Basak Pardo":         [10.2841, 123.8815], "Basak San Nicolas": [10.2935, 123.9032],
  "Binaliw":             [10.3622, 123.8629], "Budlaan":           [10.3634, 123.8508],
  "Buhisan":             [10.2841, 123.8535], "Bulacao":           [10.2703, 123.8674],
  "Buot-Taup Pardo":     [10.2791, 123.8718], "Busay":             [10.3622, 123.8756],
  "Calamba":             [10.3012, 123.8906], "Cambinocot":        [10.3577, 123.8843],
  "Camputhaw":           [10.3295, 123.8944], "Capitol Site":      [10.3182, 123.8909],
  "Carreta":             [10.3085, 123.8920], "Central Poblacion": [10.2985, 123.9021],
  "Cogon Pardo":         [10.2868, 123.8695], "Cogon Ramos":       [10.3022, 123.8938],
  "Day-as":              [10.2858, 123.8878], "Duljo":             [10.2896, 123.8940],
  "Ermita":              [10.2927, 123.8985], "Guadalupe":         [10.2941, 123.9018],
  "Guba":                [10.4011, 123.8418], "Hipodromo":         [10.3196, 123.9094],
  "Inayawan":            [10.2773, 123.8672], "Kalubihan":         [10.2998, 123.8955],
  "Kalunasan":           [10.2878, 123.8768], "Kamagayan":         [10.3009, 123.8967],
  "Kasambagan":          [10.3238, 123.9118], "Kinasang-an Pardo": [10.2838, 123.8748],
  "Labangon":            [10.2887, 123.8862], "Lahug":             [10.3233, 123.8988],
  "Lorega San Miguel":   [10.2989, 123.8942], "Lusaran":           [10.3689, 123.8414],
  "Luz":                 [10.3145, 123.9025], "Mabini":            [10.3095, 123.8966],
  "Mabolo":              [10.3209, 123.9171], "Malubog":           [10.3522, 123.8579],
  "Manipis":             [10.3678, 123.8832], "Nasipit":           [10.3302, 123.9266],
  "Nga-an":              [10.2698, 123.8548], "Nivel Hills":       [10.3363, 123.8886],
  "Non-oc":              [10.2648, 123.8445], "Pari-an":           [10.2971, 123.8963],
  "Pasil":               [10.3046, 123.8972], "Pit-os":            [10.3836, 123.8819],
  "Poblacion Pardo":     [10.2824, 123.8722], "Pulangbato":        [10.3065, 123.8834],
  "Pung-ol Sibugay":     [10.3766, 123.9063], "Punta Princesa":    [10.2784, 123.8896],
  "Quiot Pardo":         [10.2804, 123.8637], "Ramos":             [10.3124, 123.8964],
  "San Antonio":         [10.3195, 123.9108], "San Jose":          [10.3019, 123.8948],
  "San Nicolas Proper":  [10.2959, 123.8991], "San Roque":         [10.3092, 123.9131],
  "Santa Cruz":          [10.3056, 123.9012], "Santa Lucia":       [10.2994, 123.8975],
  "Santo Niño":          [10.2979, 123.8951], "Sapangdaku":        [10.3388, 123.8823],
  "Sawang Calero":       [10.3107, 123.8859], "Sinsin":            [10.3589, 123.8642],
  "Sirao":               [10.3867, 123.8699], "Sudlon I":          [10.3978, 123.8628],
  "Sudlon II":           [10.4022, 123.8551], "T. Padilla":        [10.3164, 123.9008],
  "Tabunan":             [10.3789, 123.8622], "Tagbao":            [10.3425, 123.8928],
  "Talamban":            [10.3567, 123.9149], "Taptap":            [10.3422, 123.8579],
  "Tejero":              [10.3195, 123.9234], "Tinago":            [10.2995, 123.8968],
  "Tisa":                [10.2878, 123.8782], "To-ong Pardo":      [10.2802, 123.8751],
  "Tugbongan":           [10.3512, 123.9024], "Zapatera":          [10.3115, 123.8975],
};
const DEFAULT_CENTER: [number, number] = [10.3157, 123.8854];

// ── MapPicker — center-pin drag (mobile) + click-to-place marker (desktop) ───
function MapPicker({ lat, lon, barangay, onPin }: {
  lat: number | null; lon: number | null;
  barangay: string;
  onPin: (lat: number, lon: number) => void;
}) {
  const mapRef       = useRef<HTMLDivElement>(null);
  const mapInstance  = useRef<L.Map | null>(null);
  const markerRef    = useRef<L.Marker | null>(null);
  const onPinRef     = useRef(onPin);
  const latRef       = useRef(lat);
  const lonRef       = useRef(lon);
  const [isDragging, setIsDragging]   = useState(false);
  const [isDesktop,  setIsDesktop]    = useState(() => window.innerWidth >= 1024);

  // Keep refs fresh on every render
  useEffect(() => { onPinRef.current = onPin; }, [onPin]);
  useEffect(() => { latRef.current = lat; lonRef.current = lon; }, [lat, lon]);

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const center = BARANGAY_COORDS[barangay] ?? DEFAULT_CENTER;
    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false })
      .setView(center, 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

    const pinIcon = L.divIcon({
      html: `<div style="display:flex;flex-direction:column;align-items:center">
        <div style="width:40px;height:40px;border-radius:50%;background:#003366;border:2.5px solid #f9c23c;display:flex;align-items:center;justify-content:center;font-size:20px">⛽</div>
        <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid #003366;margin-top:-1px"></div>
      </div>`,
      className: "",
      iconAnchor: [20, 50],
    });

    // Switches between mobile (center-pin + moveend) and desktop (click marker)
    const applyBehavior = (desktop: boolean) => {
      map.off("moveend");
      map.off("click");
      map.off("dragstart");
      map.off("dragend");

      if (desktop) {
        // Remove mobile center-pin handlers; place/restore marker
        if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
        const existingLat = latRef.current;
        const existingLon = lonRef.current;
        if (existingLat !== null && existingLon !== null) {
          markerRef.current = L.marker([existingLat, existingLon], { icon: pinIcon }).addTo(map);
        }
        map.on("click", (e: L.LeafletMouseEvent) => {
          const { lat: lt, lng: ln } = e.latlng;
          if (markerRef.current) { markerRef.current.setLatLng([lt, ln]); }
          else { markerRef.current = L.marker([lt, ln], { icon: pinIcon }).addTo(map); }
          onPinRef.current(lt, ln);
        });
      } else {
        // Remove desktop marker; use center-pin + moveend
        if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
        map.on("dragstart", () => setIsDragging(true));
        map.on("dragend",   () => setIsDragging(false));
        map.on("moveend", () => {
          const c = map.getCenter();
          onPinRef.current(c.lat, c.lng);
        });
        // Immediately emit current center as pin
        const c = map.getCenter();
        onPinRef.current(c.lat, c.lng);
      }
    };

    // Apply initial behavior
    applyBehavior(window.innerWidth >= 1024);
    if (window.innerWidth < 1024) {
      // Mobile: emit barangay center as starting pin
      onPinRef.current(center[0], center[1]);
    }

    // Re-apply on viewport resize
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      applyBehavior(desktop);
    };
    window.addEventListener("resize", handleResize);

    mapInstance.current = map;
    return () => {
      window.removeEventListener("resize", handleResize);
      markerRef.current = null;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // Re-center when barangay changes, clear desktop marker
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const center = BARANGAY_COORDS[barangay] ?? DEFAULT_CENTER;
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
    map.setView(center, 16, { animate: true });
    if (window.innerWidth < 1024) {
      onPinRef.current(center[0], center[1]);
    }
  }, [barangay]);

  return (
    <div className="space-y-2">
      {/* Map container with center-pin overlay */}
      <div className="isolate relative w-full rounded-xl overflow-hidden border border-outline-variant" style={{ height: 280 }}>
        <div ref={mapRef} className="w-full h-full" />

        {/* Center pin — mobile only, hidden on desktop */}
        <div
          className="absolute inset-0 pointer-events-none flex-col items-center justify-center"
          style={{ zIndex: 1000, display: isDesktop ? "none" : "flex" }}
        >
          {/* Pin icon lifts when dragging */}
          <div style={{
            transform: isDragging ? "translateY(-12px)" : "translateY(0px)",
            transition: isDragging ? "transform 0.1s ease-out" : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            filter: isDragging
              ? "drop-shadow(0 10px 8px rgba(0,0,0,0.35))"
              : "drop-shadow(0 3px 4px rgba(0,0,0,0.3))",
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "#003366", border: "2.5px solid #f9c23c",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}>⛽</div>
              {/* Arrow pointing down */}
              <div style={{
                width: 0, height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "10px solid #003366",
                marginTop: -1,
              }} />
            </div>
          </div>
          {/* Ground shadow shrinks when pin lifts */}
          <div style={{
            width: isDragging ? 12 : 20,
            height: isDragging ? 4 : 7,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.18)",
            marginTop: 3,
            transition: "all 0.2s ease",
          }} />
        </div>

        {/* Hint */}
        {lat === null && !isDesktop && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1001] bg-[#003366]/80 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
            <span className="material-symbols-outlined text-[14px]">swipe</span>
            Drag map to position pin
          </div>
        )}
        {lat === null && isDesktop && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1001] bg-[#003366]/80 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
            <span className="material-symbols-outlined text-[14px]">ads_click</span>
            Click map to place pin
          </div>
        )}
      </div>

      {/* Coordinates readout */}
      {lat !== null && lon !== null ? (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl text-xs text-[#003366]">
          <span className="material-symbols-outlined text-base shrink-0">where_to_vote</span>
          <span className="font-bold">Pinned:</span>
          <span className="font-mono">{lat.toFixed(6)}, {lon.toFixed(6)}</span>
        </div>
      ) : (
        <p className="text-xs text-slate-400 flex items-center gap-1.5 px-1">
          <span className="material-symbols-outlined text-base">my_location</span>
          Position the map so the pin is over your station
        </p>
      )}
    </div>
  );
}

// ── SheetPicker — bottom sheet on mobile, centered modal on desktop ──────────
type SheetPickerProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  icon: string;
  webStyle?: boolean; // use inline select styling on web
};

function SheetPicker({ value, onChange, options, placeholder, icon }: SheetPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [search, options]);

  const handleSelect = (o: string) => { onChange(o); setOpen(false); setSearch(""); };
  const handleClose  = () => { setOpen(false); setSearch(""); };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-10 text-sm text-left transition-all focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 relative"
      >
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">{icon}</span>
        <span className={value ? "text-on-surface" : "text-outline"}>{value || placeholder}</span>
        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">expand_more</span>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
          <div className="relative w-full lg:max-w-md bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl flex flex-col max-h-[75vh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0 lg:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="px-4 pb-3 pt-2 shrink-0 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#003366] text-base">{placeholder}</h3>
                <button type="button" onClick={handleClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">search</span>
                <input
                  type="text"
                  placeholder={`Search ${placeholder.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <span className="material-symbols-outlined text-base">cancel</span>
                  </button>
                )}
              </div>
              {filtered.length > 0 && (
                <p className="text-xs text-gray-400 mt-1.5 ml-1">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
              )}
            </div>
            <div className="overflow-y-auto flex-1 px-2 py-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                  <p className="text-sm">No results found</p>
                </div>
              ) : filtered.map((o) => {
                const selected = value === o;
                return (
                  <button key={o} type="button" onClick={() => handleSelect(o)}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-sm transition-colors active:scale-[0.98] ${selected ? "bg-blue-50 text-[#003366] font-semibold" : "text-gray-800 hover:bg-gray-50"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-base ${selected ? "text-[#003366]" : "text-gray-300"}`}>{icon}</span>
                      {o}
                    </div>
                    {selected && <span className="material-symbols-outlined text-[#003366] text-base">check_circle</span>}
                  </button>
                );
              })}
            </div>
            <div className="shrink-0 pb-4" />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────
type StationRegisterProps = {
  onBack: () => void;
  onSignIn?: () => void;
  onSuccess: (user: AuthUser) => void;
};

// ── Main component ────────────────────────────────────────────────────────────
export default function StationRegister({ onBack, onSuccess, onSignIn }: StationRegisterProps) {
  const [step, setStep] = useState(1);
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState<StationForm>({
    barangay: "", brand: "", officerFirstName: "", officerLastName: "",
    googleEmail: "", password: "", confirmPassword: "",
    lat: null, lon: null,
  });
  const [fuelCapacities, setFuelCapacities] = useState<Record<string, string>>({});
  const [enabledFuels,   setEnabledFuels]   = useState<Set<string>>(new Set());
  const [agreedToTerms,  setAgreedToTerms]  = useState(false);
  const [error,          setError]          = useState("");
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [confirmError,   setConfirmError]   = useState("");
  const [registering,    setRegistering]    = useState(false);

  const selectedFuels = form.brand ? BRAND_FUELS[form.brand] : [];
  const activeFuels   = selectedFuels.filter((f) => enabledFuels.has(f));

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const validateStepOne = () => {
    const { officerFirstName, officerLastName, googleEmail, password, confirmPassword } = form;
    if (!officerFirstName.trim() || !officerLastName.trim() || !googleEmail.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please complete all details first."); return false;
    }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return false; }
    if (password !== confirmPassword) { setError("Password and confirm password do not match."); return false; }
    return true;
  };

  const validateStepTwo = () => {
    if (!form.brand) { setError("Please select a brand."); return false; }
    if (!form.barangay) { setError("Please select a barangay."); return false; }
    if (form.lat === null || form.lon === null) { setError("Please pin your station location on the map."); return false; }
    if (activeFuels.length === 0) { setError("Please enable at least one fuel type."); return false; }
    if (activeFuels.some((f) => { const v = fuelCapacities[f]; return !v || Number(v) <= 0; })) {
      setError("Please enter capacity for all enabled fuel types.");
      return false;
    }
    if (!agreedToTerms) { setError("You must agree to the Terms and Conditions to proceed."); return false; }
    return true;
  };

  const goToStepTwo = () => { if (validateStepOne()) { setError(""); setStep(2); } };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateStepTwo()) setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setConfirmError("");
    setRegistering(true);
    const { barangay, brand, officerFirstName, officerLastName, googleEmail, password, lat, lon } = form;
    const email = googleEmail.trim().toLowerCase();
    const nextOfficerFirstName = officerFirstName.trim();
    const nextOfficerLastName = officerLastName.trim();

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      const fuelCapacityNumbers = Object.fromEntries(
        activeFuels.map((f) => [f, Number(fuelCapacities[f] || 0)] as const),
      );
      const totalCapacity = Object.values(fuelCapacityNumbers).reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);

      const firestoreData: Record<string, unknown> = {
        role: "station",
        email,
        firstName: nextOfficerFirstName,
        lastName: nextOfficerLastName,
        brand,
        barangay,
        assignmentStatus: "active",
        status: "online",
        registeredAt: serverTimestamp(),
        stationDirectoryId: uid,
      };
      const stationDirectoryData: Record<string, unknown> = {
        name: [(brand || "").trim(), "Station"].filter(Boolean).join(" "),
        brand,
        address: barangay,
        hours: "See station",
        lat,
        lon,
        fuels: activeFuels.map((label) => ({
          label,
          capacityLiters: fuelCapacityNumbers[label] ?? 0,
          currentCapacity: fuelCapacityNumbers[label] ?? 0,
          price: 0,
          dispensed: 0,
        })),
        barangay,
        officer: [nextOfficerFirstName, nextOfficerLastName].filter(Boolean).join(" ").trim(),
        capacity: totalCapacity,
        dispensed: 0,
        status: "online",
        accountUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const batch = writeBatch(db);
      batch.set(doc(db, "accounts", uid), firestoreData);
      batch.set(doc(db, "stationDirectory", uid), stationDirectoryData);
      await batch.commit();

      const authUser: AuthUser = {
        uid,
        email,
        role: "station",
        loginAt: new Date().toISOString(),
        firstName: nextOfficerFirstName,
        lastName: nextOfficerLastName,
        brand,
        barangay,
        assignmentStatus: "active",
        status: "online",
        registeredAt: new Date().toISOString(),
        stationDirectoryId: uid,
      };

      setShowConfirm(false);
      onSuccess(authUser);
    } catch (err) {
      if (err instanceof FirebaseError) {
        setConfirmError(err.message || "Registration failed.");
      } else if (err instanceof Error) {
        setConfirmError(err.message || "Registration failed.");
      } else {
        setConfirmError("Registration failed. Please try again.");
      }
    } finally {
      setRegistering(false);
    }
  };

  // ── Shared form sections ──────────────────────────────────────────────────
  const inputCls = "w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all";
  const labelCls = "text-xs font-bold text-on-surface-variant uppercase tracking-wider";

  const StepOneFields = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className={labelCls}>Representative Name</label>
        <div className="grid grid-cols-2 gap-3">
          <input type="text" name="officerFirstName" value={form.officerFirstName} onChange={handleChange} placeholder="First name" className={inputCls} />
          <input type="text" name="officerLastName"  value={form.officerLastName}  onChange={handleChange} placeholder="Last name"  className={inputCls} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className={labelCls}>Email</label>
        <input type="email" name="googleEmail" value={form.googleEmail} onChange={handleChange} placeholder="e.g. juan@gmail.com" className={inputCls} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelCls}>Password</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Minimum 6 characters"
              className={`${inputCls} pr-12`} />
            <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
              <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Confirm Password</label>
          <div className="relative">
            <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password"
              className={`${inputCls} pr-12`} />
            <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
              <span className="material-symbols-outlined text-xl">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const StepTwoFields = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className={labelCls}>Brand</label>
        <SheetPicker value={form.brand} onChange={(b) => {
            setForm((prev) => ({ ...prev, brand: b as Brand }));
            const fuels = BRAND_FUELS[b as Brand] || [];
            setFuelCapacities(Object.fromEntries(fuels.map((f) => [f, ""])));
            setEnabledFuels(new Set(fuels));
            setError("");
          }} options={BRANDS} placeholder="Select brand…" icon="local_gas_station" />
      </div>
      <div className="space-y-1.5">
        <label className={labelCls}>Barangay</label>
        <SheetPicker value={form.barangay} onChange={(b) => { setForm((prev) => ({ ...prev, barangay: b, lat: null, lon: null })); setError(""); }}
          options={CEBU_BARANGAYS} placeholder="Select station barangay…" icon="location_on" />
      </div>

      {/* Map location picker — only shown after barangay is selected */}
      {form.barangay ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className={labelCls}>Pin Your Location</label>
            {form.lat !== null && (
              <button type="button" onClick={() => setForm((p) => ({ ...p, lat: null, lon: null }))}
                className="text-[10px] font-bold text-red-400 hover:text-red-600 flex items-center gap-0.5 transition-colors">
                <span className="material-symbols-outlined text-[13px]">close</span>Remove pin
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400 -mt-1">
            Showing <span className="font-semibold text-[#003366]">{form.barangay}</span> — tap to pin your exact station location.
          </p>
          <MapPicker
            lat={form.lat}
            lon={form.lon}
            barangay={form.barangay}
            onPin={(lat, lon) => setForm((p) => ({ ...p, lat, lon }))}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-400 text-xs">
          <span className="material-symbols-outlined text-[20px] shrink-0">map</span>
          <span>Select a barangay above to unlock the location map.</span>
        </div>
      )}

      {selectedFuels.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className={labelCls}>Fuel Types &amp; Capacity</label>
            <span className="text-[10px] text-slate-400 font-medium shrink-0">{activeFuels.length} of {selectedFuels.length} enabled</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {selectedFuels.map((fuel) => {
              const isOn = enabledFuels.has(fuel);
              const theme = getFuelCardTheme(fuel);
              return (
                <div
                  key={fuel}
                  className={`rounded-2xl border-2 overflow-hidden transition-all ${
                    isOn ? theme.card : "bg-slate-100 border-slate-200 opacity-70 shadow-sm"
                  }`}
                >
                  <div className={`flex items-center gap-3 p-3.5 ${isOn ? "" : "grayscale-[0.35]"}`}>
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                        isOn ? theme.iconWrap : "bg-slate-300/80 ring-1 ring-slate-400/30"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[22px] ${isOn ? "text-white" : "text-slate-500"}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        local_gas_station
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-headline font-bold text-sm leading-tight truncate ${isOn ? "text-white" : "text-slate-600"}`}>{fuel}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isOn ? "text-white/75" : "text-slate-400"}`}>
                        Max tank capacity
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOn}
                      onClick={() => {
                        setEnabledFuels((prev) => {
                          const next = new Set(prev);
                          next.has(fuel) ? next.delete(fuel) : next.add(fuel);
                          return next;
                        });
                        setError("");
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                        isOn ? "bg-white/35 focus-visible:ring-white/50" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 mt-0.5 rounded-full shadow transition-transform duration-200 ${
                          isOn ? "translate-x-5 bg-white" : "translate-x-0.5 bg-white"
                        }`}
                      />
                    </button>
                  </div>
                  {isOn && (
                    <div className="px-3.5 pb-3.5 pt-0">
                      <div className="rounded-xl bg-white/95 border border-white/50 p-3 shadow-inner">
                        <div className="flex items-end justify-between gap-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Capacity
                          </label>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Liters</span>
                        </div>
                        <div className="relative mt-1.5">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={fuelCapacities[fuel] || ""}
                            onChange={(e) => {
                              setFuelCapacities((prev) => ({ ...prev, [fuel]: e.target.value }));
                              setError("");
                            }}
                            placeholder="0"
                            className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-3 pr-8 text-sm font-black text-right text-[#003366] outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/15"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                            L
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <label className="flex items-start gap-3 cursor-pointer select-none mt-1">
        <div className="relative mt-0.5 shrink-0">
          <input type="checkbox" checked={agreedToTerms} onChange={(e) => { setAgreedToTerms(e.target.checked); setError(""); }} className="sr-only" />
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${agreedToTerms ? "bg-[#003366] border-[#003366]" : "bg-white border-slate-300"}`}>
            {agreedToTerms && <span className="material-symbols-outlined text-white" style={{ fontSize: "14px", fontVariationSettings: "'wght' 700" }}>check</span>}
          </div>
        </div>
        <span className="text-xs text-slate-600 leading-relaxed">
          I have read and agree to the <span className="font-bold text-[#003366]">Terms and Conditions</span> and <span className="font-bold text-[#003366]">Privacy Policy</span> of the Fuel Rationing System.
        </span>
      </label>
    </div>
  );

  // ── Step tabs (shared) ────────────────────────────────────────────────────
  const StepTabs = ({ dark = false }: { dark?: boolean }) => (
    <div className={`mb-5 relative grid grid-cols-2 gap-2 rounded-xl p-1 overflow-hidden ${dark ? "bg-white/10" : "bg-surface-container-low"}`}>
      <div className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-lg shadow-sm transition-transform duration-300 ease-out ${step === 1 ? "translate-x-0" : "translate-x-[calc(100%+0.5rem)]"} ${dark ? "bg-white" : "bg-[#003366]"}`} />
      <button type="button" onClick={() => setStep(1)}
        className={`relative z-10 rounded-lg py-2 text-xs font-bold transition-colors duration-300 ${step === 1 ? (dark ? "text-[#003366]" : "text-white") : (dark ? "text-white/60" : "text-slate-500")}`}>
        1. Details
      </button>
      <button type="button" onClick={() => { if (step === 2 || validateStepOne()) { setError(""); setStep(2); } }}
        className={`relative z-10 rounded-lg py-2 text-xs font-bold transition-colors duration-300 ${step === 2 ? (dark ? "text-[#003366]" : "text-white") : (dark ? "text-white/60" : "text-slate-500")}`}>
        2. Station Info
      </button>
    </div>
  );

  return (
    <>
      {/* ── Confirm modal (shared) ─────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-[#003366] px-5 py-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-yellow-300 icon-fill text-[24px]">help</span>
              <div>
                <p className="text-white font-headline font-black text-sm leading-none">Confirm Registration</p>
                <p className="text-white/60 text-[10px] mt-0.5">Please verify your station details</p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-slate-500">Is this information correct?</p>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                {[
                  { label: "Barangay",       value: form.barangay },
                  { label: "Brand",          value: form.brand },
                  { label: "Representative", value: `${form.officerFirstName} ${form.officerLastName}`.trim() },
                  { label: "Fuel Types",     value: `${activeFuels.length} enabled` },
                ].map((d) => (
                  <div key={d.label} className="flex justify-between">
                    <span className="text-slate-400 text-xs">{d.label}</span>
                    <span className="font-bold text-[#003366] text-xs">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
            {confirmError && (
              <div className="flex items-center gap-2 bg-error-container text-on-error-container px-5 py-3 text-sm">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                {confirmError}
              </div>
            )}
            <div className="flex gap-3 px-5 pb-5">
              <button type="button" disabled={registering} onClick={() => setShowConfirm(false)}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl text-sm active:scale-95 transition-all disabled:opacity-50">
                Go Back
              </button>
              <button type="button" disabled={registering} onClick={() => void handleConfirm()}
                className="flex-1 bg-[#003366] text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {registering
                  ? <><span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>Registering…</>
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile layout ─────────────────────────────────────────────────── */}
      <div className="flex flex-col min-h-dvh bg-background lg:hidden">
        {/* Header */}
        <div className="relative flex items-center justify-center px-6 py-4 bg-slate-100/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
          <button onClick={onBack} className="absolute left-4 p-2 hover:bg-slate-200/50 rounded-full transition-all active:scale-95 text-[#003366]">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="text-center">
            <h1 className="text-[#003366] font-headline font-bold text-lg leading-none">Station Registration</h1>
            <p className="text-[10px] text-[#003366] font-black uppercase tracking-wider opacity-70">A.G.A.S</p>
          </div>
        </div>

        <main className="flex-1 px-6 pt-8 pb-12 max-w-md mx-auto w-full">
          <div className="mb-6">
            <h2 className="font-headline font-extrabold text-primary text-2xl">Register Station</h2>
            <p className="text-on-surface-variant text-sm mt-1">Fill in the station and officer details.</p>
          </div>

          <StepTabs />

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && StepOneFields}
            {step === 2 && StepTwoFields}

            {error && (
              <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            {step === 1 ? (
              <button type="button" onClick={goToStepTwo}
                className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">
                Next
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => { setError(""); setStep(1); }}
                  className="w-full border border-outline-variant text-on-surface font-headline font-bold py-4 rounded-xl active:scale-95 transition-all">
                  Back
                </button>
                <button type="submit"
                  className="w-full bg-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">
                  Create Account
                </button>
              </div>
            )}
          </form>

          {onSignIn && (
            <p className="text-center text-xs text-on-surface-variant mt-5">
              Already have an account?{" "}
              <button type="button" onClick={onSignIn} className="font-bold text-[#003366] underline underline-offset-2 active:opacity-70">
                Sign In
              </button>
            </p>
          )}
        </main>
      </div>

      {/* ── Desktop layout ────────────────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-dvh">

        {/* Left branding panel */}
        <div className="w-[420px] shrink-0 bg-gradient-to-br from-[#001228] via-[#001e40] to-[#003366] flex flex-col px-10 py-10 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/[0.03] pointer-events-none" />
          <div className="absolute bottom-10 -right-16 w-72 h-72 rounded-full bg-white/[0.04] pointer-events-none" />

          {/* Back */}
          <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium group w-fit">
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Back
          </button>

          {/* Brand */}
          <div className="mt-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#001e40] icon-fill text-[22px]">local_gas_station</span>
            </div>
            <div>
              <p className="text-white font-black text-base tracking-widest uppercase leading-none">A.G.A.S</p>
              <p className="text-white/40 text-[10px] tracking-wider uppercase mt-0.5">Fuel Rationing System</p>
            </div>
          </div>

          {/* Headline */}
          <div className="mt-10 space-y-3">
            <h1 className="text-white font-headline font-black text-4xl leading-tight">Register<br />Your Station</h1>
            <p className="text-white/50 text-sm leading-relaxed">
              Join the AGAS network and start serving your community with fair fuel allocation.
            </p>
          </div>

          {/* Step indicators */}
          <div className="mt-10 space-y-4">
            {[
              { num: 1, label: "Officer Details",    desc: "Representative & credentials" },
              { num: 2, label: "Station Information", desc: "Location, brand & fuel types"  },
            ].map((s) => {
              const active  = step === s.num;
              const done    = step >  s.num;
              return (
                <div key={s.num} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black border-2 transition-all ${
                    done   ? "bg-yellow-400 border-yellow-400 text-[#001e40]" :
                    active ? "bg-white border-white text-[#003366]" :
                             "bg-transparent border-white/30 text-white/30"
                  }`}>
                    {done ? <span className="material-symbols-outlined text-[14px]">check</span> : s.num}
                  </div>
                  <div className="pt-0.5">
                    <p className={`text-sm font-bold leading-none ${active || done ? "text-white" : "text-white/30"}`}>{s.label}</p>
                    <p className={`text-xs mt-0.5 ${active ? "text-white/60" : "text-white/25"}`}>{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8">
            <p className="text-white/20 text-[10px] uppercase tracking-widest">© 2026 Mata Technologies Inc.</p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 bg-slate-50 flex items-start justify-center overflow-y-auto py-12 px-8">
          <div className="w-full max-w-2xl">

            {/* Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Card header */}
              <div className="bg-gradient-to-r from-[#001e40] to-[#003366] px-8 py-6">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Station Registration</p>
                <h2 className="text-white font-headline font-black text-2xl">
                  {step === 1 ? "Officer Details" : "Station Information"}
                </h2>
                <p className="text-white/50 text-sm mt-1">
                  {step === 1 ? "Enter the representative's credentials." : "Set up your station's fuel availability."}
                </p>
              </div>

              <div className="px-8 py-6">
                {/* Step tabs */}
                <StepTabs />

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {step === 1 && StepOneFields}
                  {step === 2 && StepTwoFields}

                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                      <span className="material-symbols-outlined text-base shrink-0">error</span>
                      {error}
                    </div>
                  )}

                  {step === 1 ? (
                    <button type="button" onClick={goToStepTwo}
                      className="w-full bg-[#003366] text-white font-headline font-bold py-4 rounded-xl shadow-lg hover:bg-[#002244] active:scale-[0.98] transition-all">
                      Next — Station Information
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setError(""); setStep(1); }}
                        className="flex-1 border-2 border-slate-200 text-slate-600 font-headline font-bold py-4 rounded-xl hover:border-slate-300 active:scale-[0.98] transition-all">
                        Back
                      </button>
                      <button type="submit"
                        className="flex-[2] bg-[#003366] text-white font-headline font-bold py-4 rounded-xl shadow-lg hover:bg-[#002244] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">domain_add</span>
                        Create Station Account
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {onSignIn && (
              <p className="text-center text-slate-400 text-xs mt-4">
                Already have an account?{" "}
                <button type="button" onClick={onSignIn} className="font-semibold text-[#003366] hover:underline">
                  Sign In
                </button>
              </p>
            )}
            <p className="text-center text-slate-400 text-xs mt-2">© 2026 Mata Technologies Inc. · A.G.A.S</p>
          </div>
        </div>
      </div>
    </>
  );
}
