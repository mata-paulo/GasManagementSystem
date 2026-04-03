import { useState, useMemo } from "react";
import BottomNav from "../components/BottomNav";

const USER_TABS = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "user-history", icon: "receipt_long", label: "Transactions" },
  { id: "map", icon: "map", label: "Map" },
  { id: "settings", icon: "account_circle", label: "Account" },
];

const history = [
  { id: 1, station: "Shell – Fuente Osmeña", date: "March 30, 2026", time: "10:24 AM", liters: 4.0, fuelType: "Regular", pricePerLiter: 62, status: "Dispensed" },
  { id: 2, station: "Petron – Jones Ave",    date: "March 27, 2026", time: "09:45 AM", liters: 2.5, fuelType: "Regular", pricePerLiter: 62, status: "Dispensed" },
  { id: 3, station: "Caltex – Mango Ave",    date: "March 24, 2026", time: "08:12 AM", liters: 1.5, fuelType: "Diesel",  pricePerLiter: 56, status: "Dispensed" },
];

const FILTERS = [
  { id: "all",   label: "All" },
  { id: "today", label: "Today" },
  { id: "week",  label: "Week" },
  { id: "month", label: "Month" },
];

// Parse "Month DD, YYYY" date strings used in the mock data
function parseTxDate(dateStr: string): Date {
  return new Date(dateStr);
}

export default function UserScanHistory({ activeTab, onTabChange, resident, onShowQR }) {
  const [filter, setFilter] = useState("all");

  // "Gasoline" residents see Regular fuel; "Diesel" residents see Diesel
  const residentFuelType = resident?.gasType === "Diesel" ? "Diesel" : "Regular";

  const filtered = useMemo(() => {
    const now = new Date();
    return history.filter((tx) => {
      if (tx.fuelType !== residentFuelType) return false;
      if (filter === "all") return true;
      const d = parseTxDate(tx.date);
      if (filter === "today") {
        return d.toDateString() === now.toDateString();
      }
      if (filter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (filter === "month") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [filter]);

  const grouped = filtered.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {} as Record<string, typeof history>);

  const totalLiters = filtered.reduce((sum, tx) => sum + tx.liters, 0);
  const totalSpent  = filtered.reduce((sum, tx) => sum + tx.liters * tx.pricePerLiter, 0);

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Header */}
      <div className="flex items-center px-6 py-4 bg-primary-container sticky top-0 z-40">
        <div className="flex-1 flex flex-col items-center">
          <h1 className="text-white font-headline font-bold text-lg leading-none">
            Transactions History
          </h1>
          <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-0.5">
            Your fuel transaction records
          </p>
        </div>
        <span className="material-symbols-outlined text-tertiary-fixed icon-filled text-[28px]">
          receipt_long
        </span>
      </div>

      <main className="flex-1 px-5 pt-5 pb-36 max-w-2xl mx-auto w-full space-y-5">
        {/* Filter bar */}
        <div className="flex justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 px-5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                filter === f.id
                  ? "bg-[#003366] text-white border-[#003366]"
                  : "bg-white text-slate-500 border-slate-200 active:scale-95"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary-container/10 border border-primary-container/20 rounded-2xl p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Dispensed</p>
            <p className="text-xl font-black font-headline text-primary-container">{totalLiters.toFixed(1)} L</p>
          </div>
          <div className="bg-tertiary/10 border border-tertiary/20 rounded-2xl p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Transactions</p>
            <p className="text-xl font-black font-headline text-tertiary">{filtered.length}</p>
          </div>
          <div className="bg-[#003366]/10 border border-[#003366]/20 rounded-2xl p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Total Spent</p>
            <p className="text-xl font-black font-headline text-[#003366]">₱{totalSpent.toFixed(0)}</p>
          </div>
        </div>

        {/* Grouped history */}
        {Object.entries(grouped).map(([date, txs]) => (
          <section key={date} className="space-y-3">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              {date}
            </p>
            {txs.map((tx) => {
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
          </section>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <span className="material-symbols-outlined text-outline text-[48px]">
              receipt_long
            </span>
            <p className="text-sm text-on-surface-variant font-medium">
              No transactions yet.
            </p>
          </div>
        )}
      </main>

      {/* Floating QR button */}
      <div className="fixed bottom-32 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <button
          type="button"
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
