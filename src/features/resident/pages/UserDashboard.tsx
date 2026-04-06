import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import BottomNav from "@/shared/components/navigation/BottomNav";


const DEFAULT_LAT = 10.3157;
const DEFAULT_LON = 123.8854;

const USER_TABS = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "user-history", icon: "receipt_long", label: "Transactions" },
  { id: "map", icon: "map", label: "Map" },
  { id: "settings", icon: "account_circle", label: "Account" },
];

const ANNOUNCEMENTS = [
  {
    tag: "We Value Your Feedback",
    title: "Let us know how we can serve you better!",
    subtitle: "Share your experience and help us improve the AGAS fuel allocation service for everyone.",
    cta: "Share Feedback",
    bgClass: "bg-gradient-to-br from-[#4a148c] to-[#6a1f9a]",
    decorIcon: "rate_review",
    badgeIcon: "favorite",
    badgeIconClass: "text-[#ce93d8]",
    tagClass: "text-[#ce93d8]",
    ctaClass: "bg-[#ce93d8] text-[#003366]",
  },
];

export default function UserDashboard({ resident, activeTab, onTabChange, onShowQR, selectedVehicle = 1, onSelectVehicle, onUpdateResident = undefined }) {
  const mapPreviewRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [v2Form, setV2Form] = useState({ vehicle2Type: "car", vehicle2Plate: "", vehicle2GasType: "" });
  const [v2Saving, setV2Saving] = useState(false);
  const [v2Error, setV2Error] = useState("");
  const [confirmingVehicle, setConfirmingVehicle] = useState(false);
  const setSelectedVehicle = (v: number) => onSelectVehicle?.(v);

  const fullName = resident
    ? `${resident.firstName || ""} ${resident.lastName || ""}`.trim()
    : "Resident User";

  const vehicles = (resident?.vehicles ?? []) as Array<{ type: string; plate: string; gasType: string }>;
  const activeVehicle = vehicles[selectedVehicle] ?? vehicles[0] ?? { type: "car", plate: "N/A", gasType: "" };
  const plate = activeVehicle.plate || "N/A";
  const vehicleType = activeVehicle.type || "car";
  const activeGasType = activeVehicle.gasType || "";
  const canAddVehicle = vehicles.length < 5;

  const barangay = resident?.barangay || "Not set";

  const vehicleAllocations = [
    { weeklyAllocation: 20, usedLiters: 8 },
    { weeklyAllocation: 15, usedLiters: 13 },
    { weeklyAllocation: 25, usedLiters: 3 },
    { weeklyAllocation: 20, usedLiters: 17 },
    { weeklyAllocation: 18, usedLiters: 5 },
  ];
  const { weeklyAllocation, usedLiters } = vehicleAllocations[selectedVehicle] ?? vehicleAllocations[0];
  const remainingLiters = Math.max(weeklyAllocation - usedLiters, 0);
  const usagePercent = Math.min((usedLiters / weeklyAllocation) * 100, 100);
  const pctLeft = Math.round((remainingLiters / weeklyAllocation) * 100);

  const statusConfig =
    pctLeft > 50
      ? {
          section: "bg-[#e8f5e9] border-[#2e7d32]/25",
          iconClass: "text-[#2e7d32] icon-fill text-[32px]",
          valueClass: "text-4xl font-black font-headline leading-none text-[#2e7d32]",
          labelClass: "text-base font-bold mt-1 text-[#2e7d32]",
          circleColor: "#2e7d32",
          pctClass: "text-lg font-black leading-none text-[#2e7d32]",
          barClass: "bg-[#2e7d32]",
          rowClass: "flex justify-between mt-2 text-sm font-bold text-[#2e7d32]",
        }
      : pctLeft > 20
      ? {
          section: "bg-[#fff3e0] border-[#f57c00]/25",
          iconClass: "text-[#f57c00] icon-fill text-[32px]",
          valueClass: "text-4xl font-black font-headline leading-none text-[#f57c00]",
          labelClass: "text-base font-bold mt-1 text-[#e65100]",
          circleColor: "#f57c00",
          pctClass: "text-lg font-black leading-none text-[#f57c00]",
          barClass: "bg-[#f57c00]",
          rowClass: "flex justify-between mt-2 text-sm font-bold text-[#f57c00]",
        }
      : {
          section: "bg-[#ffebee] border-[#c62828]/25",
          iconClass: "text-[#c62828] icon-fill text-[32px]",
          valueClass: "text-4xl font-black font-headline leading-none text-[#c62828]",
          labelClass: "text-base font-bold mt-1 text-[#c62828]",
          circleColor: "#c62828",
          pctClass: "text-lg font-black leading-none text-[#c62828]",
          barClass: "bg-[#c62828]",
          rowClass: "flex justify-between mt-2 text-sm font-bold text-[#c62828]",
        };

  const allTransactionsByVehicle = [
    [
      { id: 1, station: "Shell – Fuente Osmeña", date: "Mar 30, 2026", time: "10:24 AM", liters: 4.0, fuelType: "Regular", pricePerLiter: 62 },
      { id: 2, station: "Petron – Jones Ave",    date: "Mar 27, 2026", time: "09:45 AM", liters: 2.5, fuelType: "Regular", pricePerLiter: 62 },
      { id: 3, station: "Caltex – Mango Ave",    date: "Mar 24, 2026", time: "08:12 AM", liters: 1.5, fuelType: "Diesel",  pricePerLiter: 56 },
    ],
    [
      { id: 1, station: "Total – Lahug",         date: "Apr 1, 2026",  time: "07:15 AM", liters: 6.0, fuelType: "Diesel",  pricePerLiter: 56 },
      { id: 2, station: "Petron – Mandaue",      date: "Mar 28, 2026", time: "11:30 AM", liters: 5.0, fuelType: "Diesel",  pricePerLiter: 56 },
      { id: 3, station: "Shell – A.S. Fortuna",  date: "Mar 25, 2026", time: "02:00 PM", liters: 2.0, fuelType: "Regular", pricePerLiter: 62 },
    ],
    [
      { id: 1, station: "Caltex – Colon St.",    date: "Apr 2, 2026",  time: "08:00 AM", liters: 3.0, fuelType: "Regular", pricePerLiter: 62 },
      { id: 2, station: "Shell – Talisay",       date: "Mar 29, 2026", time: "03:45 PM", liters: 0.0, fuelType: "Regular", pricePerLiter: 62 },
    ],
    [
      { id: 1, station: "Petron – Banilad",      date: "Apr 3, 2026",  time: "06:50 AM", liters: 5.0, fuelType: "Regular", pricePerLiter: 62 },
      { id: 2, station: "Total – Mactan",        date: "Apr 1, 2026",  time: "10:00 AM", liters: 7.0, fuelType: "Regular", pricePerLiter: 62 },
      { id: 3, station: "Shell – Fuente Osmeña", date: "Mar 30, 2026", time: "01:20 PM", liters: 5.0, fuelType: "Diesel",  pricePerLiter: 56 },
    ],
    [
      { id: 1, station: "Caltex – Urgello",      date: "Apr 4, 2026",  time: "09:10 AM", liters: 5.0, fuelType: "Diesel",  pricePerLiter: 56 },
      { id: 2, station: "Petron – Hernan Cortes", date: "Apr 2, 2026", time: "04:30 PM", liters: 0.0, fuelType: "Diesel",  pricePerLiter: 56 },
    ],
  ];

  const allTransactions = allTransactionsByVehicle[selectedVehicle] ?? allTransactionsByVehicle[0];

  // "Gasoline" residents see Regular fuel; "Diesel" residents see Diesel
  const residentFuelType = activeGasType === "Diesel" ? "Diesel" : "Regular";
  const recentTransactions = allTransactions.filter((tx) => tx.fuelType === residentFuelType);

  const touchStartX = useRef(null);
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      setAnnouncementIdx((i) =>
        diff > 0 ? (i + 1) % ANNOUNCEMENTS.length : (i - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length
      );
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    if (!mapPreviewRef.current || mapInstanceRef.current) return;

    // Start map immediately with default center — don't wait for GPS
    const map = L.map(mapPreviewRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      preferCanvas: true,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: false,
    }).setView([DEFAULT_LAT, DEFAULT_LON], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      updateWhenIdle: false,
      updateWhenZooming: false,
      keepBuffer: 4,
    }).addTo(map);

    const markerEl = document.createElement("div");
    markerEl.style.cssText =
      "width:14px;height:14px;border-radius:50%;background:#003366;border:2px solid #fff;box-shadow:0 0 0 3px rgba(0,51,102,0.25)";
    const markerIcon = L.divIcon({ html: markerEl.outerHTML, className: "", iconSize: [14, 14], iconAnchor: [7, 7] });
    const marker = L.marker([DEFAULT_LAT, DEFAULT_LON], { icon: markerIcon }).addTo(map);

    mapInstanceRef.current = map;

    // Update center once GPS resolves
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lon } = pos.coords;
          map.setView([lat, lon], 13);
          marker.setLatLng([lat, lon]);
        },
        () => {},
        { timeout: 5000, maximumAge: 60000 }
      );
    }

    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; };
  }, []);

  const ann = ANNOUNCEMENTS[announcementIdx];

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <main className="flex-1 pb-44 max-w-2xl mx-auto w-full">

        {/* Profile bar */}
        <div className="mx-4 mt-5 mb-4 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-outline-variant/20">
          <div className="w-11 h-11 rounded-full border-2 border-[#2e7d32] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#2e7d32] text-2xl">person</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-headline font-bold text-[#003366] text-base leading-tight truncate">{fullName}</p>
            <button
              type="button"
              onClick={() => setShowVehiclePicker(true)}
              className="flex items-center gap-1 text-xs text-slate-400 font-medium capitalize"
            >
              <span>{vehicleType} · Resident</span>
              <span className="material-symbols-outlined text-[12px] text-primary-container">swap_vert</span>
            </button>
          </div>
          <div className="shrink-0 flex flex-col items-center justify-center bg-[#003366] rounded-xl px-3 py-1.5 gap-0.5">
            <span className="material-symbols-outlined text-yellow-400 icon-fill text-[18px]">local_gas_station</span>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">AGAS</span>
          </div>
        </div>

        <div className="px-4 space-y-4">

          {/* User Details */}
          <section className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setShowVehiclePicker(true)}
              className="relative rounded-2xl bg-surface-container-low p-3 space-y-1 text-left w-full active:scale-95 transition-all"
            >
              <div className="flex items-center justify-between text-on-surface-variant">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">directions_car</span>
                  <span className="text-[9px] font-bold uppercase tracking-tight">Vehicle</span>
                </div>
                <span className="material-symbols-outlined text-[12px] text-primary-container">swap_vert</span>
              </div>
              <p className="text-sm font-black font-headline text-primary uppercase">{plate}</p>
              <p className="text-[9px] text-on-surface-variant capitalize">{vehicleType}</p>
              <span className="material-symbols-outlined absolute bottom-2 right-2 text-[14px] text-primary-container">add_circle</span>
            </button>
            <div className="rounded-2xl bg-surface-container-low p-3 space-y-1">
              <div className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-[13px]">location_on</span>
                <span className="text-[9px] font-bold uppercase tracking-tight">Barangay</span>
              </div>
              <p className="text-sm font-black font-headline text-primary leading-tight">{barangay}</p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-3 space-y-1">
              <div className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-[13px]">verified_user</span>
                <span className="text-[9px] font-bold uppercase tracking-tight">Status</span>
              </div>
              <p className="text-sm font-black font-headline text-green-700">Active</p>
              <p className="text-[9px] text-on-surface-variant">Verified</p>
            </div>
          </section>

          {/* Allocation */}
          <section className={`rounded-2xl p-5 shadow-sm border ${statusConfig.section}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Fuel Allocation
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`material-symbols-outlined ${statusConfig.iconClass}`}>
                    local_gas_station
                  </span>
                  <p className={statusConfig.valueClass}>
                    {remainingLiters.toFixed(1)}<span className="text-xl ml-1 font-normal">Liters</span>
                  </p>
                </div>
                <p className={statusConfig.labelClass}>Remaining</p>
              </div>
              <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                  <circle
                    cx="28" cy="28" r="22" fill="none"
                    stroke={statusConfig.circleColor}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 22}`}
                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - pctLeft / 100)}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={statusConfig.pctClass}>{pctLeft}%</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Left</span>
                </div>
              </div>
            </div>

            {/* Progress bar — width is a computed percentage, must use style */}
            <div className="h-5 w-full rounded-full bg-white/70 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${statusConfig.barClass}`}
                style={{ width: `${usagePercent}%` }}
              >
                {usagePercent > 20 && (
                  <span className="text-[9px] font-black text-white">{usedLiters}L used</span>
                )}
              </div>
            </div>
            <div className={statusConfig.rowClass}>
              <span className="ml-auto">Total: {weeklyAllocation} L / week</span>
            </div>
          </section>

          {/* Map preview */}
          <section className="rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 relative h-[180px] isolate">
            <div ref={mapPreviewRef} className="w-full h-full" />
            <button
              onClick={() => onTabChange("map")}
              aria-label="View full map"
              className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-[#003366] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">open_in_full</span>
              View Full Map
            </button>
            <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] font-bold text-[#003366] shadow">
              Nearby Stations
            </div>
          </section>

          {/* Recent Activity */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
                Recent Fuel Activity
              </h3>
              <button className="text-xs font-bold text-primary-container hover:underline">View All</button>
            </div>
            <div className="space-y-2">
              {recentTransactions.map((tx) => {
                const total = tx.liters * tx.pricePerLiter;
                return (
                  <div key={tx.id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-outline-variant/10 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#003366] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-white icon-fill text-[22px]">local_gas_station</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface leading-tight">{tx.station}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{tx.date} · {tx.time}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">
                        {tx.fuelType}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-on-surface leading-none">{tx.liters.toFixed(1)} L</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">₱{tx.pricePerLiter}/L</p>
                      <p className="text-sm font-black text-[#003366] mt-0.5">₱{total.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Announcements — swipeable banner carousel */}
          <section className="space-y-3 pb-2">
            <h3 className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
              Announcements
            </h3>

            <div
              className={`rounded-2xl overflow-hidden select-none relative min-h-[170px] ${ann.bgClass}`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Decorative background icon */}
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 opacity-10 pointer-events-none icon-fill text-[140px] text-white">
                {ann.decorIcon}
              </span>

              <div className="relative z-10 p-5 flex flex-col gap-3">
                {/* Tag row */}
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined icon-fill text-[16px] ${ann.badgeIconClass}`}>
                    {ann.badgeIcon}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${ann.tagClass}`}>
                    {ann.tag}
                  </span>
                </div>

                {/* Headline */}
                <p className="text-white font-headline font-black text-lg leading-snug">
                  {ann.title}
                </p>

                {/* Subtitle */}
                <p className="text-white/65 text-[11px] leading-relaxed">
                  {ann.subtitle}
                </p>

                {/* CTA + dots */}
                <div className="flex items-center justify-between mt-1">
                  <button className={`px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${ann.ctaClass}`}>
                    {ann.cta}
                  </button>

                  <div className="flex gap-1.5 items-center">
                    {ANNOUNCEMENTS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setAnnouncementIdx(i)}
                        aria-label={`Go to announcement ${i + 1}`}
                        className={`rounded-full transition-all duration-300 h-1.5 ${
                          i === announcementIdx ? "w-5 bg-white" : "w-1.5 bg-white/35"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Floating QR button */}
      <div className="fixed bottom-32 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <button
          onClick={() => onShowQR({ plate, vehicleType, gasType: activeGasType })}
          className="pointer-events-auto flex items-center gap-2 bg-[#003366] text-white font-headline font-bold px-6 py-3.5 rounded-full shadow-[0_8px_32px_rgba(0,51,102,0.45)] active:scale-95 transition-all border-2 border-white/20"
        >
          <span className="material-symbols-outlined icon-fill">qr_code</span>
          View My QR Code
        </button>
      </div>

      {/* Vehicle picker sheet */}
      {showVehiclePicker && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowVehiclePicker(false)} />
          <div className="relative w-full bg-white rounded-t-2xl shadow-2xl px-5 pt-5 pb-28 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-headline font-bold text-[#003366] text-base">Select Vehicle</h3>
              <button type="button" onClick={() => setShowVehiclePicker(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            {vehicles.map((v, i) => (
              <button key={i} type="button"
                onClick={() => { setSelectedVehicle(i); setShowVehiclePicker(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-[0.98] ${selectedVehicle === i ? "border-[#003366] bg-blue-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedVehicle === i ? "bg-[#003366]" : "bg-gray-200"}`}>
                  <span className={`material-symbols-outlined text-[20px] icon-fill ${selectedVehicle === i ? "text-white" : "text-gray-500"}`}>
                    {v.type === "motorcycle" ? "two_wheeler" : v.type === "truck" ? "local_shipping" : "directions_car"}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-black font-headline uppercase tracking-wider text-base ${selectedVehicle === i ? "text-[#003366]" : "text-gray-700"}`}>{v.plate}</p>
                  <p className="text-xs text-gray-400 capitalize">{v.type} · {v.gasType}</p>
                </div>
                {selectedVehicle === i && (
                  <span className="material-symbols-outlined text-[#003366] text-[20px]">check_circle</span>
                )}
              </button>
            ))}
            {canAddVehicle && (
              <button
                type="button"
                onClick={() => { setShowVehiclePicker(false); setAddingVehicle(true); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 text-sm font-bold hover:border-[#003366]/40 hover:text-[#003366] transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Add Vehicle
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Vehicle sheet */}
      {addingVehicle && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setAddingVehicle(false); setV2Error(""); }} />
          <div className="relative w-full bg-white rounded-t-2xl shadow-2xl px-5 pt-5 pb-28 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-[#003366] text-base">Add Vehicle</h3>
              <button type="button" onClick={() => { setAddingVehicle(false); setV2Error(""); }} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Type</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "car", label: "Car", icon: "directions_car" },
                  { id: "truck", label: "Truck", icon: "local_shipping" },
                  { id: "motorcycle", label: "Motorcycle", icon: "two_wheeler" },
                ].map((v) => {
                  const active = v2Form.vehicle2Type === v.id;
                  return (
                    <button key={v.id} type="button"
                      onClick={() => setV2Form((f) => ({ ...f, vehicle2Type: v.id }))}
                      className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 font-bold text-xs transition-all active:scale-95 ${active ? "bg-[#003366] border-[#003366] text-white shadow" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                      <span className={`material-symbols-outlined text-[22px] ${active ? "icon-fill" : ""}`}>{v.icon}</span>
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plate No. */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plate No.</p>
              <input
                type="text"
                value={v2Form.vehicle2Plate}
                onChange={(e) => setV2Form((f) => ({ ...f, vehicle2Plate: e.target.value.toUpperCase() }))}
                placeholder={v2Form.vehicle2Type === "motorcycle" ? "e.g. 1234AB" : "e.g. ABC-1234"}
                maxLength={10}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-[#003366]"
              />
            </div>

            {/* Fuel Type */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fuel Type</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "Diesel", label: "Diesel", icon: "oil_barrel", activeClass: "bg-emerald-700 border-emerald-700 text-white" },
                  { id: "Gasoline", label: "Gasoline", icon: "local_gas_station", activeClass: "bg-red-600 border-red-600 text-white" },
                ].map((g) => {
                  const active = v2Form.vehicle2GasType === g.id;
                  return (
                    <button key={g.id} type="button"
                      onClick={() => setV2Form((f) => ({ ...f, vehicle2GasType: g.id }))}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 font-bold text-sm transition-all active:scale-95 ${active ? g.activeClass : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                      <span className={`material-symbols-outlined text-[24px] ${active ? "icon-fill" : ""}`}>{g.icon}</span>
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {v2Error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-xl text-xs">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                {v2Error}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (!v2Form.vehicle2Plate.trim()) { setV2Error("Please enter the plate number."); return; }
                if (!v2Form.vehicle2GasType) { setV2Error("Please select a fuel type."); return; }
                setV2Error("");
                setConfirmingVehicle(true);
              }}
              className="w-full bg-[#003366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Add Vehicle
            </button>
          </div>
        </div>
      )}

      {/* Confirm Vehicle modal */}
      {confirmingVehicle && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmingVehicle(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="bg-[#003366] px-5 py-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-yellow-300 icon-fill text-[24px]">help</span>
              <div>
                <p className="text-white font-headline font-black text-sm leading-none">Confirm Vehicle</p>
                <p className="text-white/60 text-[10px] mt-0.5">Please verify your vehicle details</p>
              </div>
            </div>
            {/* Details */}
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-slate-500">Is this information correct?</p>
              <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-2.5">
                {[
                  { label: "Vehicle Type", value: v2Form.vehicle2Type, icon: v2Form.vehicle2Type === "motorcycle" ? "two_wheeler" : v2Form.vehicle2Type === "truck" ? "local_shipping" : "directions_car" },
                  { label: "Plate No.", value: v2Form.vehicle2Plate.trim().toUpperCase(), icon: "pin" },
                  { label: "Fuel Type", value: v2Form.vehicle2GasType, icon: "local_gas_station" },
                ].map((d) => (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#003366] text-[18px] icon-fill shrink-0">{d.icon}</span>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d.label}</span>
                      <span className="text-sm font-black text-[#003366] capitalize">{d.value}</span>
                    </div>
                  </div>
                ))}
              </div>
              {v2Error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-xl text-xs">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  {v2Error}
                </div>
              )}
            </div>
            {/* Actions */}
            <div className="flex gap-3 px-5 pb-5">
              <button
                type="button"
                onClick={() => setConfirmingVehicle(false)}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl text-sm"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={v2Saving}
                onClick={async () => {
                  if (!resident?.uid) { setV2Error("Session error. Please log out and log back in."); return; }
                  setV2Saving(true);
                  setV2Error("");
                  try {
                    const plate2 = v2Form.vehicle2Plate.trim().toUpperCase();
                    const newVehicles = [...vehicles, { type: v2Form.vehicle2Type, plate: plate2, gasType: v2Form.vehicle2GasType }];
                    await updateDoc(doc(db, "accounts", resident.uid as string), {
                      vehicles: newVehicles,
                      ...(newVehicles.length === 2 && {
                        vehicle2Type: v2Form.vehicle2Type,
                        vehicle2Plate: plate2,
                        vehicle2GasType: v2Form.vehicle2GasType,
                      }),
                    });
                    onUpdateResident?.({ vehicles: newVehicles, vehicle2Type: v2Form.vehicle2Type, vehicle2Plate: plate2, vehicle2GasType: v2Form.vehicle2GasType });
                    setConfirmingVehicle(false);
                    setAddingVehicle(false);
                    setV2Form({ vehicle2Type: "car", vehicle2Plate: "", vehicle2GasType: "" });
                  } catch {
                    setV2Error("Failed to save. Please try again.");
                  } finally {
                    setV2Saving(false);
                  }
                }}
                className="flex-1 bg-[#003366] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {v2Saving
                  ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Saving…</>
                  : <><span className="material-symbols-outlined text-[16px]">check_circle</span>Confirm</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active={activeTab} onChange={onTabChange} tabs={USER_TABS} />
    </div>
  );
}

