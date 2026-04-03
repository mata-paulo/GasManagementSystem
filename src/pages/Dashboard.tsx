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

function fuelBarColor(fuelType: string): string {
  const n = fuelType.toLowerCase();
  if (n.includes("premium diesel")) return "bg-green-500";
  if (n.includes("diesel"))         return "bg-slate-500";
  if (n.includes("regular") || n.includes("unleaded")) return "bg-amber-500";
  if (n.includes("super premium"))  return "bg-blue-600";
  if (n.includes("premium"))        return "bg-red-500";
  return "bg-slate-400";
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

  const stationCode    = officer?.stationCode || "N/A";
  const barangay       = officer?.barangay    || "Not set";
  const brand          = officer?.brand       || "Station Name";
  const fuelCapacities = officer?.fuelCapacities || {};
  const fuelPrices     = officer?.fuelPrices     || {};
  const fuelInventory  = officer?.fuelInventory  || {};
  const totalCapacity  = totalCapacityLabel(officer);

  const visibleFuels = ORDERED_FUELS.filter((f) => {
    const af = officer?.availableFuels;
    if (!Array.isArray(af) || af.length === 0) return true;
    return af.includes(f);
  });

  // Summary stats
  const totalLitersToday = recentTransactions.reduce((s, t) => s + t.liters, 0);
  const totalRevenueToday = recentTransactions.reduce((s, t) => s + t.liters * t.pricePerLiter, 0);

  const sorted = [...recentTransactions].sort(
    (a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime()
  );

  return (
    <div className="flex flex-col min-h-dvh bg-[#f0f2f5]">
      <main className="flex-1 pb-44 max-w-2xl mx-auto w-full">
        <div className="space-y-5">

          {/* ── Station header ── */}
          <div className="px-4 pt-5">
            <section
              className="rounded-2xl px-4 py-4 flex flex-col gap-3 shadow-lg"
              style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d3270 100%)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: "22px", fontVariationSettings: "'FILL' 1" }}>
                      local_gas_station
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-headline font-black text-white text-base leading-tight truncate">{brand}</p>
                    <p className="text-xs text-white/50">Barangay {barangay} · ID: {stationCode}</p>
                  </div>
                </div>

                {/* Status pill */}
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

              {/* Inline stats row */}
              <div className="flex justify-between pt-3 border-t border-white/10">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Total Capacity</p>
                  <p className="font-black text-white text-base leading-tight mt-0.5">{totalCapacity.toLocaleString()} L</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Last Update</p>
                  <p className="font-black text-white text-base leading-tight mt-0.5">{lastUpdateLabel}</p>
                </div>
              </div>
            </section>
          </div>

          {/* ── Summary stat cards (2×2) ── */}
          <div className="px-4 grid grid-cols-2 gap-3">
            {[
              { label: "Transactions Today", value: recentTransactions.length, icon: "receipt_long",      color: "text-[#003366]", bg: "bg-blue-50",    border: "border-blue-200"   },
              { label: "Liters Dispensed",   value: `${totalLitersToday.toLocaleString()} L`, icon: "local_gas_station", color: "text-green-700", bg: "bg-green-50",   border: "border-green-200"  },
              { label: "Revenue Today",      value: `₱${totalRevenueToday.toLocaleString(undefined,{maximumFractionDigits:0})}`, icon: "payments", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
              { label: "Fuel Types",         value: visibleFuels.length,       icon: "oil_barrel",        color: "text-orange-600", bg: "bg-orange-50",  border: "border-orange-200" },
            ].map((c) => (
              <div key={c.label} className={`${c.bg} border ${c.border} rounded-2xl p-4 flex items-center gap-3 shadow-sm`}>
                <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
                  <span className={`material-symbols-outlined icon-fill ${c.color} text-[20px]`}>{c.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide leading-tight">{c.label}</p>
                  <p className={`text-xl font-black font-headline ${c.color} leading-tight mt-0.5`}>{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Fuel Inventory ── */}
          <section className="px-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-headline font-black text-[#003366] uppercase tracking-wider">Fuel Inventory</h3>
              <button onClick={onEditFuels} type="button" className="flex items-center gap-1 text-xs font-bold text-[#003366] hover:underline">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                Edit Pricing
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {visibleFuels.map((fuelType) => {
                const theme       = fuelTypeTheme(fuelType);
                const barColor    = fuelBarColor(fuelType);
                const capacityL   = fuelCapacities[fuelType] ?? 0;
                const inventoryL  = fuelInventory[fuelType]  ?? capacityL;
                const price       = fuelPrices[fuelType]     ?? 0;
                const pct         = capacityL > 0 ? Math.min(100, Math.round((inventoryL / capacityL) * 100)) : 0;

                return (
                  <div key={fuelType} className="px-4 py-3 flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: theme.soft }}
                    >
                      <span className="material-symbols-outlined" style={{ color: theme.text, fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>
                        local_gas_station
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-bold text-slate-800 truncate">{fuelType}</p>
                        <p className="text-xs font-black shrink-0" style={{ color: theme.text }}>₱{Number(price).toFixed(2)}/L</p>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`${barColor} h-1.5 rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-[9px] text-slate-400 font-medium">{Number(inventoryL).toLocaleString()} L remaining</p>
                        <p className="text-[9px] text-slate-400 font-medium">{pct}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Recent Transactions ── */}
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
              {sorted.slice(0, MAX_DASHBOARD_TRANSACTIONS).map((tx) => {
                const txTheme  = fuelTypeTheme(tx.fuelType);
                const total    = Math.round(tx.liters * tx.pricePerLiter * 100) / 100;
                return (
                  <div key={tx.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-slate-100 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-[#003366] flex items-center justify-center shrink-0">
                      <span className="text-white font-headline font-black text-sm">{nameInitials(tx.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800 truncate">
                        {tx.plate} <span className="font-medium text-slate-400">({tx.vehicleType})</span>
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{tx.name} · {tx.date} · {tx.time}</p>
                      <span
                        className="inline-block mt-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ background: txTheme.soft, color: txTheme.text }}
                      >
                        {tx.fuelType}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-[#003366]">{tx.liters.toFixed(1)} L</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">₱{tx.pricePerLiter.toFixed(2)}/L</p>
                      <p className="text-sm font-black text-[#003366] mt-0.5">
                        ₱{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

