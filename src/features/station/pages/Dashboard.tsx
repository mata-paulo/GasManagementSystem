import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/shared/components/navigation/BottomNav";
import {
  fetchStationTransactions,
  getStationDirectoryIdDisplayPrefix,
  resolveStationPresenceStatus,
  setStationPresenceStatus,
  type DispenseTransaction,
  type StationAccount,
} from "@/lib/data/agas";
import StationDesktopSidebar from "@/shared/components/navigation/StationDesktopSidebar";
import { formatLitersQuantity } from "@/utils/fuelVolume";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type FuelTheme = { soft: string; text: string; muted?: string; gradient: string };

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
  totalPaid: number;
};

type DashboardProps = {
  officer: StationAccount | null;
  onScan: () => void;
  onEditFuels: () => void;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  lastUpdated?: Date | null;
  /** After presence is written to Firestore (manual Online/Offline). */
  onPresenceSaved?: () => void;
};

const ORDERED_FUELS = [
  "Diesel", "Premium Diesel", "Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)", "Kerosene",
] as const;

const MAX_DASHBOARD_TRANSACTIONS = 3;

function fuelTypeTheme(fuelType: string): FuelTheme {
  const n = fuelType.toLowerCase();
  if (n.includes("kerosene"))       return { soft: "#f5f3ff", text: "#6d28d9", muted: "#7c3aed", gradient: "#8b5cf6" };
  if (n.includes("premium diesel")) return { soft: "#dcfce7", text: "#166534", muted: "#15803d", gradient: "#16a34a" };
  if (n.includes("diesel"))         return { soft: "#f1f5f9", text: "#475569", muted: "#64748b", gradient: "#64748b" };
  if (n.includes("regular") || n.includes("unleaded")) return { soft: "#fefce8", text: "#854d0e", muted: "#a16207", gradient: "#ca8a04" };
  if (n.includes("super premium"))  return { soft: "#eff6ff", text: "#1d4ed8", muted: "#2563eb", gradient: "#2563eb" };
  if (n.includes("premium"))        return { soft: "#fee2e2", text: "#991b1b", muted: "#b91c1c", gradient: "#dc2626" };
  return { soft: "#f1f5f9", text: "#475569", muted: "#64748b", gradient: "#64748b" };
}

function fuelBarColor(fuelType: string): string {
  const n = fuelType.toLowerCase();
  if (n.includes("kerosene"))       return "bg-violet-500";
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


function mapDispenseToTransaction(tx: DispenseTransaction, idx: number): Transaction {
  const d = tx.occurredAt ?? tx.createdAt;
  const dateStr = d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const timeStr = d ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";
  const totalPaid =
    Number.isFinite(tx.totalPaid) && tx.totalPaid > 0
      ? Math.round(tx.totalPaid * 100) / 100
      : Math.round(tx.liters * tx.pricePerLiter * 100) / 100;
  return {
    id: idx,
    name: tx.residentName || "Unknown",
    plate: tx.plate || "---",
    vehicleType: tx.vehicleType || "---",
    date: dateStr,
    time: timeStr,
    liters: tx.liters,
    fuelType: tx.fuelType,
    pricePerLiter: tx.pricePerLiter,
    totalPaid,
  };
}

export default function Dashboard({
  officer,
  onScan,
  onEditFuels,
  onLogout,
  activeTab,
  onTabChange,
  lastUpdated,
  onPresenceSaved,
}: DashboardProps) {
  const [lastUpdateLabel, setLastUpdateLabel] = useState("Never");
  const [transactions, setTransactions] = useState<DispenseTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [stationStatus, setStationStatus] = useState<"online" | "offline">(
    resolveStationPresenceStatus(officer ?? {}),
  );

  useEffect(() => {
    if (!lastUpdated) {
      setLastUpdateLabel("Never");
      return;
    }

    setLastUpdateLabel(timeAgo(lastUpdated));
    const interval = setInterval(() => setLastUpdateLabel(timeAgo(lastUpdated)), 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  useEffect(() => {
    setStationStatus(
      resolveStationPresenceStatus(officer ?? {}),
    );
  }, [officer]);

  useEffect(() => {
    const stationUid = officer?.uid;
    if (!stationUid) return;
    let cancelled = false;
    setLoadingTransactions(true);
    fetchStationTransactions(stationUid)
      .then((data) => { if (!cancelled) setTransactions(data); })
      .catch((err) => console.error("[Dashboard] Failed to fetch transactions:", err))
      .finally(() => { if (!cancelled) setLoadingTransactions(false); });
    return () => { cancelled = true; };
  }, [officer?.uid, lastUpdated]);

  const recentTransactions = useMemo(
    () => transactions.map(mapDispenseToTransaction),
    [transactions],
  );

  const stationDirectoryShortId = getStationDirectoryIdDisplayPrefix(officer);
  const barangay       = officer?.barangay    || "Not set";
  const brand          = officer?.brand       || "Station Name";
  const officerName    = officer?.officerFirstName || officer?.firstName || "Officer";
  const fuelCapacities = officer?.fuelCapacities || {};
  const fuelPrices     = officer?.fuelPrices     || {};
  const fuelInventory  = officer?.fuelInventory  || {};

  const activeFuels = ORDERED_FUELS.filter((f) => {
    const af = officer?.availableFuels;
    if (!Array.isArray(af) || af.length === 0) return true;
    return af.includes(f);
  });

  /** Sum `capacityLiters` for each active fuel (matches stationDirectory.fuels[]). */
  const totalCapacity = activeFuels.reduce((sum, f) => {
    const v = fuelCapacities[f];
    return sum + (typeof v === "number" ? v : Number(v) || 0);
  }, 0);

  const sortedTx = [...recentTransactions].sort(
    (a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime()
  );
  const totalRevenue   = recentTransactions.reduce((sum, tx) => sum + tx.totalPaid, 0);
  const totalDispensedFromFuels =
    typeof officer?.fuelTotalDispensed === "number"
      ? officer.fuelTotalDispensed
      : Object.values((officer as unknown as { fuelDispensed?: Record<string, number> })?.fuelDispensed ?? {})
          .reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
  const totalDispensed =
    totalDispensedFromFuels > 0
      ? totalDispensedFromFuels
      : recentTransactions.reduce((sum, tx) => sum + tx.liters, 0);

  const persistPresence = (next: "online" | "offline") => {
    const uid = typeof officer?.uid === "string" ? officer.uid : "";
    if (!uid) return;
    void setStationPresenceStatus(uid, next)
      .then(() => {
        setStationStatus(next);
        setShowStatusMenu(false);
        onPresenceSaved?.();
      })
      .catch((err) => console.error("[Dashboard] Failed to update presence:", err));
  };

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
            <button type="button" onClick={() => persistPresence("online")}
              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">Online</span>
              {stationStatus === "online" && <span className="material-symbols-outlined text-emerald-500 ml-auto" style={{ fontSize: "14px" }}>check</span>}
            </button>
            <button type="button" onClick={() => persistPresence("offline")}
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
    <div className="flex h-dvh bg-[#eef2f7]">

      <StationDesktopSidebar activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} />

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
                <p className="text-[10px] text-slate-400">ID: {stationDirectoryShortId}</p>
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
              { label: "Total Capacity",    value: `${totalCapacity.toLocaleString(undefined, { maximumFractionDigits: 4 })} L`, icon: "water_drop",      iconBg: "bg-blue-50",   iconColor: "text-blue-600",   valColor: "text-blue-700" },
              { label: "Total Transactions",value: `${recentTransactions.length}`,         icon: "receipt_long",    iconBg: "bg-amber-50",  iconColor: "text-amber-600",  valColor: "text-amber-700" },
              { label: "Total Dispensed",   value: `${formatLitersQuantity(totalDispensed)} L`,       icon: "local_gas_station",iconBg: "bg-green-50",  iconColor: "text-green-600",  valColor: "text-green-700" },
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
                          <span className="text-[10px] text-slate-400">{Number(inv).toLocaleString(undefined, { maximumFractionDigits: 4 })} L current</span>
                          <span className="text-[10px] text-slate-400">{Number(cap).toLocaleString(undefined, { maximumFractionDigits: 4 })} L cap</span>
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
                  const totalPrice = tx.totalPaid;
                  const litersLabel = `${formatLitersQuantity(tx.liters)} L`;
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
                        <p className="text-sm font-black text-[#003366]">{litersLabel}</p>
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
                      <p className="text-xs text-white/50">ID: {stationDirectoryShortId}</p>
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
                          <button type="button" onClick={() => persistPresence("online")}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/10 transition-colors">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">Online</span>
                            {stationStatus === "online" && <span className="material-symbols-outlined text-emerald-400 ml-auto" style={{ fontSize: "14px" }}>check</span>}
                          </button>
                          <button type="button" onClick={() => persistPresence("offline")}
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
                    <p className="font-black text-white text-base leading-tight mt-0.5">{totalCapacity.toLocaleString(undefined, { maximumFractionDigits: 4 })} L</p>
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
                        <span className="font-black text-sm text-white">{Number(inv).toLocaleString(undefined, { maximumFractionDigits: 4 })} L</span>
                        <span className="material-symbols-outlined text-white/60" style={{ fontSize: "18px" }}>trending_flat</span>
                        <span className="font-black text-sm text-white">{Number(cap).toLocaleString(undefined, { maximumFractionDigits: 4 })} L</span>
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
                  const totalPrice = tx.totalPaid;
                  const litersLabel = `${formatLitersQuantity(tx.liters)} L`;
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
                        <p className="text-base font-black text-[#003366]">{litersLabel}</p>
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

