import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/shared/components/navigation/BottomNav";
import type { ResidentAllocationSummary } from "@/lib/data/agas";
import { subscribeResidentVehicleAllocationSummary } from "@/lib/data/agas";

const USER_TABS = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "user-history", icon: "receipt_long", label: "Transactions" },
  { id: "map", icon: "map", label: "Map" },
  { id: "settings", icon: "account_circle", label: "Account" },
];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(date: Date | null) {
  if (!date) return "Unknown date";
  return date.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date | null) {
  if (!date) return "--:--";
  return date.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function matchesFilter(date: Date | null, filter: string) {
  if (!date || filter === "all") return filter === "all";

  const now = new Date();
  if (filter === "today") {
    return date.toDateString() === now.toDateString();
  }
  if (filter === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo;
  }
  if (filter === "month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  return true;
}

export default function UserScanHistory({ activeTab, onTabChange, resident, onShowQR, selectedVehicle = 0 }) {
  const [filter, setFilter] = useState("all");
  const [summary, setSummary] = useState<ResidentAllocationSummary>({
    transactions: [],
    fuelAllocation: Number(resident?.fuelAllocation ?? 20),
    usedLiters: 0,
    remainingLiters: Number(resident?.fuelAllocation ?? 20),
  });

  const vehicles = (resident?.vehicles ?? []) as Array<{ type: string; plate: string; gasType: string }>;
  const activeVehicle = vehicles[selectedVehicle] ?? vehicles[0] ?? { type: "4w", plate: "", gasType: "" };
  const activePlate = (activeVehicle?.plate || "").trim().toUpperCase();

  useEffect(() => {
    const uid = resident?.uid;
    if (!uid) return () => undefined;
    const plateKey = (activePlate || "").trim().toUpperCase();
    return subscribeResidentVehicleAllocationSummary(uid, plateKey, setSummary);
  }, [resident?.uid, activePlate]);

  const filtered = useMemo(() => {
    return summary.transactions
      .filter((tx) => !activePlate || (tx.plate || "").trim().toUpperCase() === activePlate)
      .filter((tx) => matchesFilter(tx.createdAt, filter));
  }, [activePlate, filter, summary.transactions]);

  const grouped = filtered.reduce((acc, tx) => {
    const label = formatDate(tx.createdAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(tx);
    return acc;
  }, {} as Record<string, typeof filtered>);

  const totalLiters = filtered.reduce((sum, tx) => sum + tx.liters, 0);
  const totalSpent = filtered.reduce(
    (sum, tx) => sum + Number(tx.totalPaid ?? tx.amount ?? (tx.liters * tx.pricePerLiter)),
    0,
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="sticky top-0 z-40 flex items-center bg-primary-container px-6 py-4">
        <div className="flex-1 flex flex-col items-center">
          <h1 className="font-headline text-lg font-bold leading-none text-white">Transactions History</h1>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70">Your live fuel transaction records</p>
        </div>
        <span className="material-symbols-outlined icon-filled text-[28px] text-tertiary-fixed">receipt_long</span>
      </div>

      <main className="mx-auto flex-1 w-full max-w-2xl space-y-5 px-5 pb-36 pt-5">
        <div className="flex justify-center gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`shrink-0 rounded-full border px-5 py-1.5 text-xs font-bold transition-all ${
                filter === item.id
                  ? "border-[#003366] bg-[#003366] text-white"
                  : "border-slate-200 bg-white text-slate-500 active:scale-95"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1 rounded-2xl border border-primary-container/20 bg-primary-container/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Dispensed</p>
            <p className="font-headline text-xl font-black text-primary-container">{totalLiters.toFixed(1)} L</p>
          </div>
          <div className="space-y-1 rounded-2xl border border-tertiary/20 bg-tertiary/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Transactions</p>
            <p className="font-headline text-xl font-black text-tertiary">{filtered.length}</p>
          </div>
          <div className="space-y-1 rounded-2xl border border-[#003366]/20 bg-[#003366]/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Total Spent</p>
            <p className="font-headline text-xl font-black text-[#003366]">{formatPeso(totalSpent)}</p>
          </div>
        </div>

        {Object.entries(grouped).map(([dateLabel, transactions]) => (
          <section key={dateLabel} className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{dateLabel}</p>
            {transactions.map((tx) => {
              const total = Number(tx.totalPaid ?? tx.amount ?? (tx.liters * tx.pricePerLiter));
              return (
                <div key={tx.id} className="flex items-center gap-3 rounded-2xl border border-outline-variant/10 bg-white p-3.5 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#003366]">
                    <span className="material-symbols-outlined icon-fill text-[22px] text-white">local_gas_station</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-tight text-on-surface">{tx.stationName || "Unknown Station"}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{formatDate(tx.createdAt)} · {formatTime(tx.createdAt)}</p>
                    <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                      {tx.fuelType}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-black leading-none text-on-surface">{tx.liters.toFixed(1)} L</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{formatPeso(tx.pricePerLiter)}/L</p>
                    <p className="mt-0.5 text-sm font-black text-[#003366]">{formatPeso(total)}</p>
                  </div>
                </div>
              );
            })}
          </section>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-outline">receipt_long</span>
            <p className="text-sm font-medium text-on-surface-variant">No live transactions yet.</p>
          </div>
        )}
      </main>

      <div className="pointer-events-none fixed bottom-32 left-0 right-0 z-40 flex justify-center">
        <button
          type="button"
          onClick={onShowQR}
          className="pointer-events-auto flex items-center gap-2 rounded-full border-2 border-white/20 bg-[#003366] px-6 py-3.5 font-headline font-bold text-white shadow-[0_8px_32px_rgba(0,51,102,0.45)] transition-all active:scale-95"
        >
          <span className="material-symbols-outlined icon-fill">qr_code</span>
          View My QR Code
        </button>
      </div>

      <BottomNav active={activeTab} onChange={onTabChange} tabs={USER_TABS} />
    </div>
  );
}
