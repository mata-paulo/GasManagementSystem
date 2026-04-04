import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import BottomNav from "@/shared/components/navigation/BottomNav";
import {
  subscribeResidentAllocationSummary,
  type DispenseTransaction,
  type ResidentAccount,
  WEEKLY_FUEL_LIMIT,
} from "@/lib/data/agas";


const DEFAULT_LAT = 10.3157;
const DEFAULT_LON = 123.8854;
const MAX_RECENT_TRANSACTIONS = 3;

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

function formatTransactionDate(value: Date | null): string {
  if (!value) return "Unknown date";
  return value.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTransactionTime(value: Date | null): string {
  if (!value) return "--:--";
  return value.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

type UserDashboardProps = {
  resident: ResidentAccount | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onShowQR: () => void;
};

export default function UserDashboard({ resident, activeTab, onTabChange, onShowQR }: UserDashboardProps) {
  const mapPreviewRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [transactions, setTransactions] = useState<DispenseTransaction[]>([]);
  const [liveFuelAllocation, setLiveFuelAllocation] = useState(WEEKLY_FUEL_LIMIT);
  const [usedLiters, setUsedLiters] = useState(0);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fullName = resident
    ? `${resident.firstName || ""} ${resident.lastName || ""}`.trim()
    : "Resident User";

  const plate = resident?.plate || "N/A";
  const barangay = resident?.barangay || "Not set";
  const vehicleType = resident?.vehicleType || "car";
  const residentStatus = resident?.status || "Active";
  const fuelAllocation = liveFuelAllocation;
  const remainingLiters = Math.max(fuelAllocation - usedLiters, 0);
  const usagePercent = Math.min((usedLiters / fuelAllocation) * 100, 100);
  const pctLeft = Math.round((remainingLiters / fuelAllocation) * 100);

  const recentTransactions = useMemo(
    () => transactions.slice(0, MAX_RECENT_TRANSACTIONS),
    [transactions],
  );

  useEffect(() => {
    if (!resident?.uid) {
      setTransactions([]);
      setLiveFuelAllocation(WEEKLY_FUEL_LIMIT);
      setUsedLiters(0);
      return;
    }

    setLoadingSummary(true);
    setLiveFuelAllocation(resident.fuelAllocation ?? WEEKLY_FUEL_LIMIT);

    const unsubscribe = subscribeResidentAllocationSummary(
      resident.uid,
      (summary) => {
        setTransactions(summary.transactions);
        setLiveFuelAllocation(summary.fuelAllocation);
        setUsedLiters(summary.usedLiters);
        setLoadingSummary(false);
      },
      () => {
        setTransactions([]);
        setLiveFuelAllocation(resident.fuelAllocation ?? WEEKLY_FUEL_LIMIT);
        setUsedLiters(0);
        setLoadingSummary(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [resident?.fuelAllocation, resident?.uid]);

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

  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      setAnnouncementIdx((i) =>
        diff > 0 ? (i + 1) % ANNOUNCEMENTS.length : (i - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length,
      );
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    if (!mapPreviewRef.current || mapInstanceRef.current) return;

    const map = new mapboxgl.Map({
      container: mapPreviewRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [DEFAULT_LON, DEFAULT_LAT],
      zoom: 13,
      interactive: false,
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

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lon } = pos.coords;
          map.setView([lat, lon], 13);
          marker.setLatLng([lat, lon]);
        },
        () => undefined,
        { timeout: 5000, maximumAge: 60000 },
      );
    }

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const ann = ANNOUNCEMENTS[announcementIdx];

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <main className="flex-1 pb-44 max-w-2xl mx-auto w-full">
        <div className="mx-4 mt-5 mb-4 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-outline-variant/20">
          <div className="w-11 h-11 rounded-full border-2 border-[#2e7d32] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#2e7d32] text-2xl">person</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-headline font-bold text-[#003366] text-base leading-tight truncate">{fullName}</p>
            <p className="text-xs text-slate-400 font-medium capitalize">{vehicleType} · Resident</p>
          </div>
          <div className="shrink-0 flex flex-col items-center justify-center bg-[#003366] rounded-xl px-3 py-1.5 gap-0.5">
            <span className="material-symbols-outlined text-yellow-400 icon-fill text-[18px]">local_gas_station</span>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">AGAS</span>
          </div>
        </div>

        <div className="px-4 space-y-4">
          <section className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-surface-container-low p-3 space-y-1">
              <div className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-[13px]">directions_car</span>
                <span className="text-[9px] font-bold uppercase tracking-tight">Vehicle</span>
              </div>
              <p className="text-sm font-black font-headline text-primary uppercase">{plate}</p>
              <p className="text-[9px] text-on-surface-variant capitalize">{vehicleType}</p>
            </div>
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
              <p className="text-sm font-black font-headline text-green-700">{residentStatus}</p>
              <p className="text-[9px] text-on-surface-variant">Live profile</p>
            </div>
          </section>

          <section className={`rounded-2xl p-5 shadow-sm border ${statusConfig.section}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Weekly Fuel Allocation
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`material-symbols-outlined ${statusConfig.iconClass}`}>
                    local_gas_station
                  </span>
                  <p className={statusConfig.valueClass}>
                    {remainingLiters.toFixed(1)}<span className="text-xl ml-1 font-normal">Liters</span>
                  </p>
                </div>
                <p className={statusConfig.labelClass}>{loadingSummary ? "Refreshing" : "Remaining"}</p>
              </div>
              <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
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

            <div className="h-5 w-full rounded-full bg-white/70 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${statusConfig.barClass}`}
                style={{ width: `${usagePercent}%` }}
              >
                {usagePercent > 20 && (
                  <span className="text-[9px] font-black text-white">{usedLiters.toFixed(1)}L used</span>
                )}
              </div>
            </div>
            <div className={statusConfig.rowClass}>
              <span className="ml-auto">Total: {fuelAllocation} L / week</span>
            </div>
          </section>

          <section className="rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 relative h-[180px]">
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

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
                Recent Fuel Activity
              </h3>
              <button
                type="button"
                onClick={() => onTabChange("user-history")}
                className="text-xs font-bold text-primary-container hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-2">
              {loadingSummary && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/10 text-sm text-slate-400">
                  Loading your recent transactions...
                </div>
              )}

              {!loadingSummary && recentTransactions.length === 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/10 text-sm text-slate-400">
                  No fuel transactions yet.
                </div>
              )}

              {recentTransactions.map((tx) => (
                <div key={tx.id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-outline-variant/10 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#003366] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white icon-fill text-[22px]">local_gas_station</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface leading-tight">{tx.stationName || "Unknown Station"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatTransactionDate(tx.createdAt)} · {formatTransactionTime(tx.createdAt)}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">
                      {tx.fuelType}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-on-surface leading-none">{tx.liters.toFixed(1)} L</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">₱{tx.pricePerLiter.toFixed(2)}/L</p>
                    <p className="text-sm font-black text-[#003366] mt-0.5">₱{tx.totalPaid.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3 pb-2">
            <h3 className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
              Announcements
            </h3>

            <div
              className={`rounded-2xl overflow-hidden select-none relative min-h-[170px] ${ann.bgClass}`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 opacity-10 pointer-events-none icon-fill text-[140px] text-white">
                {ann.decorIcon}
              </span>

              <div className="relative z-10 p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined icon-fill text-[16px] ${ann.badgeIconClass}`}>
                    {ann.badgeIcon}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${ann.tagClass}`}>
                    {ann.tag}
                  </span>
                </div>

                <p className="text-white font-headline font-black text-lg leading-snug">
                  {ann.title}
                </p>

                <p className="text-white/65 text-[11px] leading-relaxed">
                  {ann.subtitle}
                </p>

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

      <div className="fixed bottom-32 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <button
          onClick={onShowQR}
          className="pointer-events-auto flex items-center gap-2 bg-[#003366] text-white font-headline font-bold px-6 py-3.5 rounded-full shadow-[0_8px_32px_rgba(0,51,102,0.45)] active:scale-95 transition-all border-2 border-white/20"
        >
          <span className="material-symbols-outlined icon-fill">qr_code</span>
          View My QR Code
        </button>
      </div>

      <BottomNav active={activeTab} onChange={onTabChange} tabs={USER_TABS} />
    </div>
  );
}

