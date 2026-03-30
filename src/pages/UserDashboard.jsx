import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import BottomNav from "../components/BottomNav";

mapboxgl.accessToken = "pk.eyJ1IjoibWF0YWRldnMiLCJhIjoiY21mNmdhc3YyMGcxdzJrb21xZm80c3NpbCJ9.R0nU8Ip_9RCo-Q2aWxAbXA";

const DEFAULT_LAT = 10.3157;
const DEFAULT_LON = 123.8854;

const USER_TABS = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "user-history", icon: "receipt_long", label: "Scan History" },
  { id: "map", icon: "map", label: "Map" },
  { id: "settings", icon: "account_circle", label: "Account" },
];

export default function UserDashboard({ resident, activeTab, onTabChange, onShowQR }) {
  const mapPreviewRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [announcementIdx, setAnnouncementIdx] = useState(0);

  const fullName = resident
    ? `${resident.firstName || ""} ${resident.lastName || ""}`.trim()
    : "Resident User";

  const plate = resident?.plate || "N/A";
  const barangay = resident?.barangay || "Not set";
  const vehicleType = resident?.vehicleType || "car";

  const weeklyAllocation = 20;
  const usedLiters = 8;
  const remainingLiters = Math.max(weeklyAllocation - usedLiters, 0);
  const usagePercent = Math.min((usedLiters / weeklyAllocation) * 100, 100);
  const pctLeft = Math.round((remainingLiters / weeklyAllocation) * 100);
  const statusColor =
    pctLeft > 50 ? { bar: "#2e7d32", bg: "#e8f5e9", text: "#2e7d32", label: "Good" }
    : pctLeft > 20 ? { bar: "#f57c00", bg: "#fff3e0", text: "#e65100", label: "Running Low" }
    : { bar: "#c62828", bg: "#ffebee", text: "#c62828", label: "Almost Empty" };

  const recentTransactions = [
    { id: 1, station: "Shell - Fuente Osmeña", date: "March 30, 2026", liters: 4.0, fuelType: "Regular" },
    { id: 2, station: "Petron - Jones", date: "March 27, 2026", liters: 2.5, fuelType: "Regular" },
    { id: 3, station: "Caltex - Mango", date: "March 24, 2026", liters: 1.5, fuelType: "Diesel" },
  ];

  const announcements = [
    {
      tag: "Fuel Rationing System",
      title: "Ration smart and let our app manage the rest!",
      subtitle: "Participating stations include Shell, Petron, and Caltex locations across Cebu City.",
      cta: "View My Allocation",
      bg: "linear-gradient(135deg, #003366 0%, #0a4f8f 100%)",
      decorIcon: "local_gas_station",
      badgeIcon: "verified_user",
      badgeColor: "#f9c23c",
    },
    {
      tag: "Weekly Reminder",
      title: "Use your allocation before it resets every Monday!",
      subtitle: "Unused fuel quota does not carry over. Claim yours at any accredited station.",
      cta: "Find Nearby Stations",
      bg: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
      decorIcon: "event_repeat",
      badgeIcon: "notifications_active",
      badgeColor: "#a5d6a7",
    },
    {
      tag: "How It Works",
      title: "Show your QR code and get your fuel allocation fast!",
      subtitle: "Present your QR code and valid ID at the station counter before fueling.",
      cta: "View My QR Code",
      bg: "linear-gradient(135deg, #4a148c 0%, #6a1f9a 100%)",
      decorIcon: "qr_code_2",
      badgeIcon: "info",
      badgeColor: "#ce93d8",
    },
  ];

  const touchStartX = useRef(null);
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      setAnnouncementIdx((i) =>
        diff > 0 ? (i + 1) % announcements.length : (i - 1 + announcements.length) % announcements.length
      );
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    if (!mapPreviewRef.current || mapInstanceRef.current) return;

    const initMap = (lat, lon) => {
      const map = new mapboxgl.Map({
        container: mapPreviewRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [lon, lat],
        zoom: 13,
        interactive: false,
      });
      const el = document.createElement("div");
      el.style.cssText =
        "width:14px;height:14px;border-radius:50%;background:#003366;border:2px solid #fff;box-shadow:0 0 0 3px rgba(0,51,102,0.25)";
      new mapboxgl.Marker({ element: el }).setLngLat([lon, lat]).addTo(map);
      mapInstanceRef.current = map;
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => initMap(pos.coords.latitude, pos.coords.longitude),
        () => initMap(DEFAULT_LAT, DEFAULT_LON),
        { timeout: 8000 }
      );
    } else {
      initMap(DEFAULT_LAT, DEFAULT_LON);
    }

    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; };
  }, []);

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <main className="flex-1 pb-44 max-w-2xl mx-auto w-full">

        {/* Profile bar */}
        <div className="mx-4 mt-5 mb-4 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-outline-variant/20">
          <div className="w-11 h-11 rounded-full border-2 border-[#2e7d32] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#2e7d32]" style={{ fontSize: "24px" }}>person</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-headline font-bold text-[#003366] text-base leading-tight truncate">{fullName}</p>
            <p className="text-xs text-slate-400 font-medium capitalize">{vehicleType} · Resident</p>
          </div>
          <div className="shrink-0 flex flex-col items-center justify-center bg-[#003366] rounded-xl px-3 py-1.5 gap-0.5">
            <span className="material-symbols-outlined text-yellow-400" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>local_gas_station</span>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">Fuel Rationing</span>
          </div>
        </div>

        <div className="px-4 space-y-4">

          {/* User Details */}
          <section className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-surface-container-low p-3 space-y-1">
              <div className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>directions_car</span>
                <span className="text-[9px] font-bold uppercase tracking-tight">Vehicle</span>
              </div>
              <p className="text-sm font-black font-headline text-primary uppercase">{plate}</p>
              <p className="text-[9px] text-on-surface-variant capitalize">{vehicleType}</p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-3 space-y-1">
              <div className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>location_on</span>
                <span className="text-[9px] font-bold uppercase tracking-tight">Barangay</span>
              </div>
              <p className="text-sm font-black font-headline text-primary leading-tight">{barangay}</p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-3 space-y-1">
              <div className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>verified_user</span>
                <span className="text-[9px] font-bold uppercase tracking-tight">Status</span>
              </div>
              <p className="text-sm font-black font-headline text-green-700">Active</p>
              <p className="text-[9px] text-on-surface-variant">Verified</p>
            </div>
          </section>

          {/* Allocation — accessible, high contrast */}
          <section
            className="rounded-2xl p-5 shadow-sm border"
            style={{ background: statusColor.bg, borderColor: statusColor.bar + "40" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Fuel Allocation
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "32px", color: statusColor.bar, fontVariationSettings: "'FILL' 1" }}
                  >
                    local_gas_station
                  </span>
                  <p className="text-4xl font-black font-headline leading-none" style={{ color: statusColor.bar }}>
                    {remainingLiters.toFixed(1)}<span className="text-xl ml-1 font-normal">Liters</span>
                  </p>
                </div>
                <p className="text-base font-bold mt-1" style={{ color: statusColor.text }}>
                  Remaining
                </p>
              </div>
              <div
                className="w-16 h-16 rounded-full flex flex-col items-center justify-center border-4 shrink-0"
                style={{ borderColor: statusColor.bar, background: "#fff" }}
              >
                <span className="text-lg font-black leading-none" style={{ color: statusColor.bar }}>{pctLeft}%</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">Left</span>
              </div>
            </div>

            {/* Large progress bar */}
            <div className="h-5 w-full rounded-full bg-white/70 overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${usagePercent}%`, background: statusColor.bar }}
              >
                {usagePercent > 20 && (
                  <span className="text-[9px] font-black text-white">{usedLiters}L used</span>
                )}
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm font-bold" style={{ color: statusColor.bar }}>
              <span>0 L</span>
              <span>Total: {weeklyAllocation} L / week</span>
            </div>
          </section>

          {/* Map preview */}
          <section className="rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 relative" style={{ height: "180px" }}>
            <div ref={mapPreviewRef} style={{ width: "100%", height: "100%" }} />
            <button
              onClick={() => onTabChange("map")}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-[#003366] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>open_in_full</span>
              View Full Map
            </button>
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] font-bold text-[#003366] shadow">
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
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="bg-surface-container-lowest p-3 rounded-xl flex items-center justify-between border border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary-container/30 flex items-center justify-center">
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>local_gas_station</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">{tx.station}</p>
                      <p className="text-[10px] text-on-surface-variant">{tx.date} · {tx.fuelType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">{tx.liters.toFixed(1)} L</p>
                    <p className="text-[9px] font-bold text-tertiary uppercase">Dispensed</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Announcements — swipeable banner carousel */}
          <section className="space-y-3 pb-2">
            <h3 className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
              Announcements
            </h3>

            {/* Banner card — FuelBuddy style */}
            <div
              className="rounded-2xl overflow-hidden select-none relative"
              style={{ background: announcements[announcementIdx].bg, minHeight: "170px" }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Decorative large icon background */}
              <span
                className="material-symbols-outlined absolute -right-4 -bottom-4 opacity-10 pointer-events-none"
                style={{ fontSize: "140px", color: "#fff", fontVariationSettings: "'FILL' 1" }}
              >
                {announcements[announcementIdx].decorIcon}
              </span>

              <div className="relative z-10 p-5 flex flex-col gap-3">
                {/* Tag row */}
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "16px", color: announcements[announcementIdx].badgeColor, fontVariationSettings: "'FILL' 1" }}
                  >
                    {announcements[announcementIdx].badgeIcon}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: announcements[announcementIdx].badgeColor }}>
                    {announcements[announcementIdx].tag}
                  </span>
                </div>

                {/* Headline */}
                <p className="text-white font-headline font-black text-lg leading-snug">
                  {announcements[announcementIdx].title}
                </p>

                {/* Subtitle */}
                <p className="text-white/65 text-[11px] leading-relaxed">
                  {announcements[announcementIdx].subtitle}
                </p>

                {/* CTA button + dots */}
                <div className="flex items-center justify-between mt-1">
                  <button
                    className="px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95"
                    style={{ background: announcements[announcementIdx].badgeColor, color: "#003366" }}
                  >
                    {announcements[announcementIdx].cta}
                  </button>

                  <div className="flex gap-1.5">
                    {announcements.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setAnnouncementIdx(i)}
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: i === announcementIdx ? "20px" : "6px",
                          height: "6px",
                          background: i === announcementIdx ? "#fff" : "rgba(255,255,255,0.35)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Floating QR button — sits above BottomNav */}
      <div className="fixed bottom-32 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <button
          onClick={onShowQR}
          className="pointer-events-auto flex items-center gap-2 bg-[#003366] text-white font-headline font-bold px-6 py-3.5 rounded-full shadow-2xl active:scale-95 transition-all border-2 border-white/20"
          style={{ boxShadow: "0 8px 32px rgba(0,51,102,0.45)" }}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code</span>
          View My QR Code
        </button>
      </div>

      <BottomNav active={activeTab} onChange={onTabChange} tabs={USER_TABS} />
    </div>
  );
}
