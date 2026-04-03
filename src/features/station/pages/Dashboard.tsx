import { useState, useEffect } from "react";
import BottomNav from "@/shared/components/navigation/BottomNav";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type FuelTheme = { soft: string; text: string; muted: string; gradient: string };

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
  availableFuels?: string[];
  [key: string]: unknown;
};

type Transaction = {
  id: number; name: string; plate: string; vehicleType: string;
  date: string; time: string; liters: number; fuelType: string; pricePerLiter: number;
};

type DashboardProps = {
  officer: DashboardOfficer | null;
  onScan: () => void;
  onEditFuels: () => void;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  lastUpdated?: Date | null;
};

const ORDERED_FUELS = [
  "Diesel", "Premium Diesel", "Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)",
] as const;

const MAX_DASHBOARD_TRANSACTIONS = 3;

const DESKTOP_NAV = [
  { id: "dashboard", label: "Dashboard",   icon: "dashboard" },
  { id: "history",   label: "Transaction", icon: "receipt_long" },
  { id: "settings",  label: "Account",     icon: "manage_accounts" },
];

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


const recentTransactions: Transaction[] = [
  { id: 12, name: "Teresita Magbanua", plate: "KLM-8877", vehicleType: "Motorcycle", date: "Apr 1, 2026", time: "05:35 AM", liters: 11.0, fuelType: "Premium (95)", pricePerLiter: 75.9 },
  { id: 11, name: "Rommel Aquino",     plate: "HIJ-5566", vehicleType: "Truck",      date: "Apr 1, 2026", time: "05:50 AM", liters: 14.5, fuelType: "Premium Diesel", pricePerLiter: 70.1 },
  { id: 10, name: "Felisa Bautista",   plate: "EFG-2244", vehicleType: "Car",        date: "Apr 1, 2026", time: "06:05 AM", liters: 20.0, fuelType: "Super Premium (97)", pricePerLiter: 78.4 },
  { id: 9,  name: "Eduardo Mendoza",   plate: "BCD-1133", vehicleType: "Truck",      date: "Apr 1, 2026", time: "06:20 AM", liters: 9.0,  fuelType: "Regular/Unleaded (91)", pricePerLiter: 72.5 },
  { id: 8,  name: "Grace Tolentino",   plate: "VWX-6650", vehicleType: "Car",        date: "Apr 1, 2026", time: "06:40 AM", liters: 15.0, fuelType: "Diesel", pricePerLiter: 68.25 },
  { id: 7,  name: "Ramon Castillo",    plate: "STU-7721", vehicleType: "Car",        date: "Apr 1, 2026", time: "06:58 AM", liters: 18.0, fuelType: "Premium (95)", pricePerLiter: 75.9 },
  { id: 6,  name: "Lorna Villanueva",  plate: "PQR-3310", vehicleType: "Motorcycle", date: "Apr 1, 2026", time: "07:10 AM", liters: 10.5, fuelType: "Regular/Unleaded (91)", pricePerLiter: 72.5 },
  { id: 5,  name: "Carlos Fernandez",  plate: "LMN-4412", vehicleType: "Truck",      date: "Apr 1, 2026", time: "07:30 AM", liters: 20.0, fuelType: "Premium Diesel", pricePerLiter: 70.1 },
  { id: 4,  name: "Ana Reyes",         plate: "XYZ-9900", vehicleType: "Car",        date: "Apr 1, 2026", time: "07:55 AM", liters: 12.0, fuelType: "Super Premium (97)", pricePerLiter: 78.4 },
  { id: 3,  name: "Juan Dela Cruz",    plate: "ABC-5678", vehicleType: "Motorcycle", date: "Apr 1, 2026", time: "08:12 AM", liters: 8.5,  fuelType: "Premium (95)", pricePerLiter: 75.9 },
  { id: 2,  name: "Maria Clara Santos",plate: "YHM-8890", vehicleType: "Car",        date: "Apr 1, 2026", time: "09:45 AM", liters: 20.0, fuelType: "Diesel", pricePerLiter: 68.25 },
  { id: 1,  name: "Rico Blanco",       plate: "GAE-1234", vehicleType: "Car",        date: "Apr 1, 2026", time: "10:24 AM", liters: 15.0, fuelType: "Regular/Unleaded (91)", pricePerLiter: 72.5 },
];

export default function Dashboard({ officer, onScan, onEditFuels, onLogout, activeTab, onTabChange, lastUpdated }: DashboardProps) {
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
  const officerName    = officer?.officerFirstName || officer?.firstName || "Officer";
  const fuelCapacities = officer?.fuelCapacities || {};
  const fuelPrices     = officer?.fuelPrices     || {};
  const fuelInventory  = officer?.fuelInventory  || {};

  const dieselCapacity = ["Diesel", "Premium Diesel"].reduce((acc, f) => {
    const v = fuelCapacities[f]; return acc + (typeof v === "number" ? v : Number(v) || 0);
  }, 0);
  const gasolineCapacity = ["Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)"].reduce((acc, f) => {
    const v = fuelCapacities[f]; return acc + (typeof v === "number" ? v : Number(v) || 0);
  }, 0);
  const totalCapacity = dieselCapacity + gasolineCapacity;

  const activeFuels = ORDERED_FUELS.filter((f) => {
    const af = officer?.availableFuels;
    if (!Array.isArray(af) || af.length === 0) return true;
    return af.includes(f);
  });

  const sortedTx = [...recentTransactions].sort(
    (a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime()
  );
  const totalRevenue   = recentTransactions.reduce((sum, tx) => sum + tx.liters * tx.pricePerLiter, 0);
  const totalDispensed = recentTransactions.reduce((sum, tx) => sum + tx.liters, 0);

  // ── Status dropdown (shared between mobile + desktop) ──────────────────────
  const StatusBadge = ({ dark = false }: { dark?: boolean }) => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowStatusMenu((p) => !p)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 border ${
          stationStatus === "online"
            ? dark ? "bg-emerald-500/20 border-emerald-400/40" : "bg-emerald-50 border-emerald-200"
            : dark ? "bg-white/10 border-white/20" : "bg-slate-100 border-slate-200"
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
        <span className={`text-[10px] font-black uppercase tracking-wider ${
          stationStatus === "online"
            ? dark ? "text-emerald-400" : "text-emerald-600"
            : dark ? "text-slate-400" : "text-slate-500"
        }`}>
          {stationStatus === "online" ? "Online" : "Offline"}
        </span>
        <span className={`material-symbols-outlined ${dark ? "text-white/50" : "text-slate-400"}`} style={{ fontSize: "14px" }}>expand_more</span>
      </button>
      {showStatusMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[120px]">
            <button type="button" onClick={() => { setStationStatus("online"); setShowStatusMenu(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">Online</span>
              {stationStatus === "online" && <span className="material-symbols-outlined text-emerald-500 ml-auto" style={{ fontSize: "14px" }}>check</span>}
            </button>
            <button type="button" onClick={() => { setStationStatus("offline"); setShowStatusMenu(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 transition-colors">
              <span className="inline-flex rounded-full h-2 w-2 bg-slate-400" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Offline</span>
              {stationStatus === "offline" && <span className="material-symbols-outlined text-slate-400 ml-auto" style={{ fontSize: "14px" }}>check</span>}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-[#eef2f7]">

      {/* ── Desktop Sidebar ──────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-52 lg:w-60 shrink-0 sticky top-0 h-screen"
        style={{ background: "linear-gradient(180deg, #0a1628 0%, #0d2a5e 100%)" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#0a1628] text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}>local_gas_station</span>
          </div>
          <div>
            <p className="font-headline font-black text-white text-sm leading-none">A.G.A.S</p>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Station Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {DESKTOP_NAV.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  isActive ? "bg-white/15 text-white" : "text-white/50 hover:text-white hover:bg-white/10"
                }`}>
                <span className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                {item.label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400" />}
              </button>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Desktop Main Content ─────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col flex-1 overflow-hidden bg-[#f1f5f9]">

        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shrink-0">
          <div>
            <h1 className="font-headline font-black text-[#003366] text-xl leading-none">Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">{brand} · Barangay {barangay}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge />
            <button type="button" onClick={onScan} title="Scan QR Code"
              className="flex items-center justify-center bg-[#003366] text-white w-10 h-10 rounded-xl shadow active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-[#003366]">{officerName}</p>
                <p className="text-[10px] text-slate-400">ID: {stationCode}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#003366] flex items-center justify-center shrink-0">
                <span className="text-white font-black text-sm">{officerName[0]?.toUpperCase() ?? "O"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 space-y-6 overflow-y-auto">

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Capacity",    value: `${totalCapacity.toLocaleString()} L`, icon: "water_drop",      iconBg: "bg-blue-50",   iconColor: "text-blue-600",   valColor: "text-blue-700" },
              { label: "Total Transactions",value: `${recentTransactions.length}`,         icon: "receipt_long",    iconBg: "bg-amber-50",  iconColor: "text-amber-600",  valColor: "text-amber-700" },
              { label: "Total Dispensed",   value: `${totalDispensed.toFixed(1)} L`,       icon: "local_gas_station",iconBg: "bg-green-50",  iconColor: "text-green-600",  valColor: "text-green-700" },
              { label: "Total Revenue",     value: `₱${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: "payments", iconBg: "bg-purple-50", iconColor: "text-purple-500", valColor: "text-purple-700" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined ${s.iconColor} text-[20px]`}
                      style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight">{s.label}</p>
                </div>
                <p className={`text-3xl font-black font-headline ${s.valColor}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Fuel Inventory — 2 cols */}
            <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-headline font-black text-[#003366] text-base">Fuel Type Inventory</h2>
                <button onClick={onEditFuels} type="button"
                  className="flex items-center gap-1 text-xs font-bold text-[#003366] hover:underline">
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                  Fuel &amp; Pricing
                </button>
              </div>
              <div className="space-y-2">
                {activeFuels.map((fuelType) => {
                  const theme = fuelTypeTheme(fuelType);
                  const cap   = fuelCapacities[fuelType] ?? 0;
                  const inv   = fuelInventory[fuelType]  ?? cap;
                  const price = fuelPrices[fuelType]     ?? 0;
                  const pct   = cap > 0 ? Math.min((inv / cap) * 100, 100) : 0;
                  return (
                    <div key={fuelType} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: theme.gradient }}>
                        <span className="material-symbols-outlined text-white text-[16px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}>local_gas_station</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-black text-slate-800 truncate">{fuelType}</p>
                          <p className="text-sm font-black shrink-0 ml-3" style={{ color: theme.text }}>
                            ₱{Number(price).toFixed(2)}/L
                          </p>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: theme.gradient }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-slate-400">{Number(inv).toLocaleString()} L current</span>
                          <span className="text-[10px] text-slate-400">{Number(cap).toLocaleString()} L cap</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Transactions — 1 col */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-headline font-black text-[#003366] text-base">Recent</h2>
                <button onClick={() => onTabChange("history")} className="text-xs font-bold text-[#003366] hover:underline">View All</button>
              </div>
              <div className="space-y-3 flex-1">
                {sortedTx.slice(0, MAX_DASHBOARD_TRANSACTIONS).map((tx) => {
                  const txTheme    = fuelTypeTheme(tx.fuelType);
                  const totalPrice = Math.round(tx.liters * tx.pricePerLiter * 100) / 100;
                  return (
                    <div key={tx.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#003366] flex items-center justify-center shrink-0">
                        <span className="text-white font-black text-xs">{nameInitials(tx.name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">{tx.plate} <span className="font-medium text-slate-400">({tx.vehicleType})</span></p>
                        <p className="text-[10px] text-slate-400">{tx.time}</p>
                        <span className="inline-block text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase"
                          style={{ background: txTheme.soft, color: txTheme.text }}>{tx.fuelType}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-[#003366]">{tx.liters.toFixed(1)} L</p>
                        <p className="text-[10px] text-slate-400">₱{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last Update</p>
                <p className="text-sm font-black text-[#003366] mt-0.5">{lastUpdateLabel}</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Mobile Layout ────────────────────────────────────────────────────── */}
      <div className="flex md:hidden flex-col flex-1">
        <main className="flex-1 pb-44 max-w-2xl mx-auto w-full">
          <div className="space-y-5">
            <div className="px-4 pt-5 space-y-3">
              <section className="rounded-2xl px-4 py-4 flex flex-col gap-3"
                style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d3270 100%)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-white shrink-0"
                        style={{ fontSize: "22px", fontVariationSettings: "'FILL' 1" }}>local_gas_station</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-headline font-black text-white text-base leading-tight truncate">{brand}</p>
                      <p className="text-xs text-white/50">Barangay {barangay}</p>
                      <p className="text-xs text-white/50">ID: {stationCode}</p>
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    <button type="button" onClick={() => setShowStatusMenu((p) => !p)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 border ${
                        stationStatus === "online" ? "bg-emerald-500/20 border-emerald-400/40" : "bg-white/10 border-white/20"
                      }`}>
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
                          <button type="button" onClick={() => { setStationStatus("online"); setShowStatusMenu(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/10 transition-colors">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">Online</span>
                            {stationStatus === "online" && <span className="material-symbols-outlined text-emerald-400 ml-auto" style={{ fontSize: "14px" }}>check</span>}
                          </button>
                          <button type="button" onClick={() => { setStationStatus("offline"); setShowStatusMenu(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/10 transition-colors">
                            <span className="inline-flex rounded-full h-2 w-2 bg-slate-400" />
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Offline</span>
                            {stationStatus === "offline" && <span className="material-symbols-outlined text-slate-400 ml-auto" style={{ fontSize: "14px" }}>check</span>}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
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

            <section className="px-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-headline font-black text-[#003366] uppercase tracking-wider">Fuel Type Inventory</h3>
                <button onClick={onEditFuels} type="button" className="text-xs font-bold text-primary-container hover:underline">
                  <span className="px-1 material-symbols-outlined shrink-0" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 0" }}>edit</span>
                  Fuel &amp; Pricing
                </button>
              </div>
              {activeFuels.map((fuelType) => {
                const theme    = fuelTypeTheme(fuelType);
                const cap      = fuelCapacities[fuelType] ?? 0;
                const inv      = fuelInventory[fuelType]  ?? cap;
                const price    = fuelPrices[fuelType]     ?? 0;
                return (
                  <div key={fuelType} className="rounded-2xl shadow-sm overflow-hidden flex items-center gap-3 px-4 py-3"
                    style={{ background: theme.gradient }}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-white/20">
                      <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: "20px", fontVariationSettings: "'FILL' 1" }}>local_gas_station</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-headline font-black text-sm text-white leading-tight truncate">{fuelType}</p>
                      <p className="font-headline font-bold text-base leading-none text-white">₱{Number(price).toFixed(2)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-black text-sm text-white">{Number(inv).toLocaleString()} L</span>
                        <span className="material-symbols-outlined text-white/60" style={{ fontSize: "18px" }}>trending_flat</span>
                        <span className="font-black text-sm text-white">{Number(cap).toLocaleString()} L</span>
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

            <section className="px-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-headline font-black text-[#003366] uppercase tracking-wider">Recent Transactions</h3>
                <button type="button" onClick={() => onTabChange("history")} className="text-xs font-bold text-primary-container hover:underline">View All</button>
              </div>
              <div className="space-y-2">
                {sortedTx.slice(0, MAX_DASHBOARD_TRANSACTIONS).map((tx) => {
                  const txTheme    = fuelTypeTheme(tx.fuelType);
                  const totalPrice = Math.round(tx.liters * tx.pricePerLiter * 100) / 100;
                  return (
                    <div key={tx.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#003366]">
                          <span className="text-white font-headline font-black text-sm tracking-tight">{nameInitials(tx.name)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">{tx.plate} <span className="font-medium text-slate-400">({tx.vehicleType})</span></p>
                          <p className="text-[10px] font-medium text-slate-400 truncate">{tx.name} · {tx.date} · {tx.time}</p>
                          <span className="inline-block mt-1 text-[8px] font-black px-2 py-0.5 rounded-full uppercase max-w-full truncate"
                            style={{ background: txTheme.soft, color: txTheme.text }}>{tx.fuelType}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 max-w-[50%]">
                        <p className="text-base font-black text-[#003366]">{tx.liters.toFixed(1)} L</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">₱{tx.pricePerLiter.toFixed(2)}/L</p>
                        <p className="text-sm font-black text-[#003366] mt-1">₱{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>

        <div className="fixed bottom-32 left-0 right-0 flex justify-center z-40 pointer-events-none">
          <button type="button" onClick={onScan}
            className="pointer-events-auto flex items-center gap-2 bg-[#003366] text-white font-headline font-bold px-6 py-3.5 rounded-full shadow-[0_8px_32px_rgba(0,51,102,0.45)] active:scale-95 transition-all border-2 border-white/20">
            <span className="material-symbols-outlined icon-filled">qr_code_scanner</span>
            Scan QR Code
          </button>
        </div>

        <BottomNav active={activeTab} onChange={onTabChange} />
      </div>

    </div>
  );
}

