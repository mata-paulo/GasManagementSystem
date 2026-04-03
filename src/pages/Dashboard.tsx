import { useState, useEffect } from "react";
import BottomNav from "../components/BottomNav";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type FuelTheme = {
  soft: string;
  text: string;
  muted: string;
  gradient: string;
};

type DashboardOfficer = {
  officerFirstName?: string;
  firstName?: string;
  stationCode?: string;
  barangay?: string;
  brand?: string;
  capacity?: string | number;
  fuelCapacities?: Record<string, number>;
  fuelPrices?: Record<string, number>;
  fuelInventory?: Record<string, number>;
  [key: string]: unknown;
};

type Transaction = {
  id: number;
  name: string;
  plate: string;
  vehicleType: string;
  date: string;
  time: string;
  liters: number;
  fuelType: string;
  pricePerLiter: number;
};

type DashboardProps = {
  officer: DashboardOfficer | null;
  onScan: () => void;
  onEditFuels: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  lastUpdated?: Date | null;
};

const ORDERED_FUELS = [
  "Diesel",
  "Premium Diesel",
  "Regular/Unleaded (91)",
  "Premium (95)",
  "Super Premium (97)",
] as const;

const MAX_DASHBOARD_TRANSACTIONS = 3;

function fuelTypeTheme(fuelType: string): FuelTheme {
  const n = fuelType.toLowerCase();
  if (n.includes("premium diesel")) return { soft: "#dcfce7", text: "#166534", muted: "#15803d", gradient: "#16a34a" };
  if (n.includes("diesel"))         return { soft: "#f1f5f9", text: "#475569", muted: "#64748b", gradient: "#64748b" };
  if (n.includes("regular") || n.includes("unleaded")) return { soft: "#fefce8", text: "#854d0e", muted: "#a16207", gradient: "#ca8a04" };
  if (n.includes("super premium"))  return { soft: "#eff6ff", text: "#1d4ed8", muted: "#2563eb", gradient: "#2563eb" };
  if (n.includes("premium"))        return { soft: "#fee2e2", text: "#991b1b", muted: "#b91c1c", gradient: "#dc2626" };
  return { soft: "#f1f5f9", text: "#475569", muted: "#64748b", gradient: "#64748b" };
}

function nameInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function totalCapacityLabel(officer: DashboardOfficer | null): number {
  const fc = officer?.fuelCapacities;
  if (fc && typeof fc === "object") {
    const sum = Object.values(fc).reduce((acc, n) => acc + (typeof n === "number" ? n : Number(n) || 0), 0);
    if (sum > 0) return sum;
  }
  const c = officer?.capacity;
  const num = typeof c === "number" ? c : Number(c);
  return Number.isFinite(num) ? num : 0;
}

const recentTransactions: Transaction[] = [
  { id: 12, name: "Teresita Magbanua", plate: "KLM-8877", vehicleType: "Motorcycle", date: "Apr 1, 2026", time: "05:35 AM", liters: 11.0, fuelType: "Premium (95)", pricePerLiter: 75.9 },
  { id: 11, name: "Rommel Aquino", plate: "HIJ-5566", vehicleType: "Truck", date: "Apr 1, 2026", time: "05:50 AM", liters: 14.5, fuelType: "Premium Diesel", pricePerLiter: 70.1 },
  { id: 10, name: "Felisa Bautista", plate: "EFG-2244", vehicleType: "Car", date: "Apr 1, 2026", time: "06:05 AM", liters: 20.0, fuelType: "Super Premium (97)", pricePerLiter: 78.4 },
  { id: 9, name: "Eduardo Mendoza", plate: "BCD-1133", vehicleType: "Truck", date: "Apr 1, 2026", time: "06:20 AM", liters: 9.0, fuelType: "Regular/Unleaded (91)", pricePerLiter: 72.5 },
  { id: 8, name: "Grace Tolentino", plate: "VWX-6650", vehicleType: "Car", date: "Apr 1, 2026", time: "06:40 AM", liters: 15.0, fuelType: "Diesel", pricePerLiter: 68.25 },
  { id: 7, name: "Ramon Castillo", plate: "STU-7721", vehicleType: "Car", date: "Apr 1, 2026", time: "06:58 AM", liters: 18.0, fuelType: "Premium (95)", pricePerLiter: 75.9 },
  { id: 6, name: "Lorna Villanueva", plate: "PQR-3310", vehicleType: "Motorcycle", date: "Apr 1, 2026", time: "07:10 AM", liters: 10.5, fuelType: "Regular/Unleaded (91)", pricePerLiter: 72.5 },
  { id: 5, name: "Carlos Fernandez", plate: "LMN-4412", vehicleType: "Truck", date: "Apr 1, 2026", time: "07:30 AM", liters: 20.0, fuelType: "Premium Diesel", pricePerLiter: 70.1 },
  { id: 4, name: "Ana Reyes", plate: "XYZ-9900", vehicleType: "Car", date: "Apr 1, 2026", time: "07:55 AM", liters: 12.0, fuelType: "Super Premium (97)", pricePerLiter: 78.4 },
  { id: 3, name: "Juan Dela Cruz", plate: "ABC-5678", vehicleType: "Motorcycle", date: "Apr 1, 2026", time: "08:12 AM", liters: 8.5, fuelType: "Premium (95)", pricePerLiter: 75.9 },
  { id: 2, name: "Maria Clara Santos", plate: "YHM-8890", vehicleType: "Car", date: "Apr 1, 2026", time: "09:45 AM", liters: 20.0, fuelType: "Diesel", pricePerLiter: 68.25 },
  { id: 1, name: "Rico Blanco", plate: "GAE-1234", vehicleType: "Car", date: "Apr 1, 2026", time: "10:24 AM", liters: 15.0, fuelType: "Regular/Unleaded (91)", pricePerLiter: 72.5 },
];

export default function Dashboard({ officer, onScan, onEditFuels, activeTab, onTabChange, lastUpdated }: DashboardProps) {
  const [lastUpdateLabel, setLastUpdateLabel] = useState("Never");
  const [stationStatus, setStationStatus] = useState<"online" | "offline">("online");
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  useEffect(() => {
    if (!lastUpdated) { setLastUpdateLabel("Never"); return; }
    setLastUpdateLabel(timeAgo(lastUpdated));
    const interval = setInterval(() => setLastUpdateLabel(timeAgo(lastUpdated)), 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);
  const stationCode = officer?.stationCode || "N/A";
  const barangay = officer?.barangay || "Not set";
  const brand = officer?.brand || "Station Name";

  const fuelCapacities = officer?.fuelCapacities || {};
  const fuelPrices = officer?.fuelPrices || {};
  const fuelInventory = officer?.fuelInventory || {};

  const totalCapacity = totalCapacityLabel(officer);
  const dieselCapacity = ["Diesel", "Premium Diesel"].reduce((acc, f) => {
    const v = fuelCapacities[f];
    return acc + (typeof v === "number" ? v : Number(v) || 0);
  }, 0);
  const gasolineCapacity = [
    "Regular/Unleaded (91)",
    "Premium (95)",
    "Super Premium (97)",
  ].reduce((acc, f) => {
    const v = fuelCapacities[f];
    return acc + (typeof v === "number" ? v : Number(v) || 0);
  }, 0);

  return (
    <div className="flex flex-col min-h-dvh bg-[#eef2f7]">
      <main className="flex-1 pb-44 max-w-2xl mx-auto w-full">

        <div className="space-y-5">

          {/* Top navy area */}
          <div className="px-4 pt-5  space-y-3">

          {/* Station Header */}
          <section className="rounded-2xl px-4 py-4 flex flex-col gap-3" style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d3270 100%)" }}>
            {/* Top row: icon + name + online */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <span
                    className="material-symbols-outlined text-white shrink-0"
                    style={{ fontSize: "22px", fontVariationSettings: "'FILL' 1" }}
                  >
                    local_gas_station
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-headline font-black text-white text-base leading-tight truncate">{brand}</p>
                  <p className="text-xs text-white/50">Barangay {barangay}</p>
                  <p className="text-xs text-white/50">ID: {stationCode}</p>
                </div>
              </div>
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowStatusMenu((p) => !p)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 border ${
                    stationStatus === "online"
                      ? "bg-emerald-500/20 border-emerald-400/40"
                      : "bg-white/10 border-white/20"
                  }`}
                >
                  {stationStatus === "online" ? (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full h-2 w-2 bg-slate-400" />
                  )}
                  <span className={`text-[10px] font-black uppercase tracking-wider ${stationStatus === "online" ? "text-emerald-400" : "text-slate-400"}`}>
                    {stationStatus === "online" ? "Online" : "Offline"}
                  </span>
                  <span className="material-symbols-outlined text-white/50" style={{ fontSize: "14px" }}>expand_more</span>
                </button>

                {showStatusMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
                    <div className="absolute right-0 top-full mt-1.5 z-50 bg-[#0d2a5e] border border-white/10 rounded-xl shadow-xl overflow-hidden min-w-[120px]">
                      <button
                        type="button"
                        onClick={() => { setStationStatus("online"); setShowStatusMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/10 transition-colors"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">Online</span>
                        {stationStatus === "online" && <span className="material-symbols-outlined text-emerald-400 ml-auto" style={{ fontSize: "14px" }}>check</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStationStatus("offline"); setShowStatusMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/10 transition-colors"
                      >
                        <span className="inline-flex rounded-full h-2 w-2 bg-slate-400" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Offline</span>
                        {stationStatus === "offline" && <span className="material-symbols-outlined text-slate-400 ml-auto" style={{ fontSize: "14px" }}>check</span>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom row: stats */}
            <div className="flex justify-between pt-3 border-t border-white/10">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Total Capacity</p>
                <p className="font-black text-white text-base leading-tight mt-0.5">
                  {(dieselCapacity + gasolineCapacity).toLocaleString()} L
                </p>
              </div>
              
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Last Update</p>
                <p className="font-black text-white text-base leading-tight mt-0.5">{lastUpdateLabel}</p>
              </div>
            </div>
          </section>

          </div>{/* end navy area */}

          {/* Fuel Type Inventory */}
          <section className="px-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-headline font-black text-[#003366] uppercase tracking-wider">
                Fuel Type Inventory
              </h3>
              <button onClick={onEditFuels} type="button" className="text-xs font-bold text-primary-container hover:underline">
                <span className="px-1 material-symbols-outlined shrink-0" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 0" }}>
                edit
              </span>
              Fuel &amp; Pricing
              </button>
            </div>
            {ORDERED_FUELS.filter((f) => {
              const af = officer?.availableFuels;
              if (!Array.isArray(af) || af.length === 0) return true;
              return af.includes(f);
            }).map((fuelType) => {
              const theme = fuelTypeTheme(fuelType);
              const capacityLiters = fuelCapacities[fuelType] ?? 0;
              const inventoryLiters = fuelInventory[fuelType] ?? capacityLiters;
              const price = fuelPrices[fuelType] ?? 0;

              return (
                <div
                  key={fuelType}
                  className="rounded-2xl shadow-sm overflow-hidden flex items-center gap-3 px-4 py-3"
                  style={{ background: theme.gradient }}
                >
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-white/20">
                    <span
                      className="material-symbols-outlined"
                      style={{ color: "#fff", fontSize: "20px", fontVariationSettings: "'FILL' 1" }}
                    >
                      local_gas_station
                    </span>
                  </div>

                  {/* Left: name + label + price */}
                  <div className="flex-1 min-w-0">
                    <p className="font-headline font-black text-sm text-white leading-tight truncate">{fuelType}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/60 mt-0.5"></p>
                    <p className="font-headline font-bold text-base leading-none text-white">
                      ₱{Number(price).toFixed(2)}
                    </p>
                  </div>

                  {/* Right: current → capacity */}
                  <div className="shrink-0 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="font-black text-sm text-white">{Number(inventoryLiters).toLocaleString()} L</span>
                      <span className="material-symbols-outlined text-white/60" style={{ fontSize: "18px" }}>trending_flat</span>
                      <span className="font-black text-sm text-white">{Number(capacityLiters).toLocaleString()} L</span>
                    </div>
                    <div className="flex justify-between gap-2 mt-0.5">
                      <p className="text-[9px] px-1 font-bold uppercase tracking-wider text-white/60">Current</p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/60">Capacity</p>
                    </div>
                  </div>
                </div>
              );
            })}
            </section>

          {/* Fuel & Pricing button */}


          {/* Recent Transactions */}
          <section className="px-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-headline font-black text-[#003366] uppercase tracking-wider">
                Recent Transactions
              </h3>
              <button type="button" onClick={() => onTabChange("history")} className="text-xs font-bold text-primary-container hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-2">
              {[...recentTransactions]
                .sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime())
                .slice(0, MAX_DASHBOARD_TRANSACTIONS)
                .map((tx) => {
                const txTheme = fuelTypeTheme(tx.fuelType);
                const totalPrice = Math.round(tx.liters * tx.pricePerLiter * 100) / 100;
                return (
                  <div key={tx.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#003366]">
                        <span className="text-white font-headline font-black text-sm tracking-tight">
                          {nameInitials(tx.name)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{tx.plate} <span className="font-medium text-slate-400">({tx.vehicleType})</span></p>
                        <p className="text-[10px] font-medium text-slate-400 truncate">
                          {tx.name} · {tx.date} · {tx.time}
                        </p>
                        <span
                          className="inline-block mt-1 text-[8px] font-black px-2 py-0.5 rounded-full uppercase max-w-full truncate"
                          style={{ background: txTheme.soft, color: txTheme.text }}
                          title={tx.fuelType}
                        >
                          {tx.fuelType}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 max-w-[50%]">
                      <p className="text-base font-black text-[#003366]">
                        {tx.liters.toFixed(1)} L
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                        ₱{tx.pricePerLiter.toFixed(2)}/L
                      </p>
                      <p className="text-sm font-black text-[#003366] mt-1">
                        ₱{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* Floating Scan QR button */}
      <div className="fixed bottom-32 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <button
          type="button"
          onClick={onScan}
          className="pointer-events-auto flex items-center gap-2 bg-[#003366] text-white font-headline font-bold px-6 py-3.5 rounded-full shadow-[0_8px_32px_rgba(0,51,102,0.45)] active:scale-95 transition-all border-2 border-white/20"
        >
          <span className="material-symbols-outlined icon-filled">qr_code_scanner</span>
          Scan QR Code
        </button>
      </div>

      <BottomNav active={activeTab} onChange={onTabChange} />
    </div>
  );
}
