import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/shared/components/navigation/BottomNav";
import {
  fetchResidentTransactions,
  type DispenseTransaction,
  type ResidentAccount,
} from "@/lib/data/agas";

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

function formatDateLabel(value: Date | null): string {
  if (!value) return "Unknown date";
  return value.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeLabel(value: Date | null): string {
  if (!value) return "--:--";
  return value.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function matchesFilter(date: Date | null, filter: string): boolean {
  if (!date || filter === "all") return true;

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

function toCsv(transactions: DispenseTransaction[]): string {
  const headers = ["Station", "Date", "Time", "Fuel Type", "Liters", "Price/L", "Total"];
  const rows = transactions.map((tx) => [
    tx.stationName,
    formatDateLabel(tx.createdAt),
    formatTimeLabel(tx.createdAt),
    tx.fuelType,
    tx.liters.toFixed(1),
    tx.pricePerLiter.toFixed(2),
    tx.totalPaid.toFixed(2),
  ]);

  return [headers, ...rows]
    .map((row) => row.map((value) => `"${value}"`).join(","))
    .join("\n");
}

type UserScanHistoryProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  resident: ResidentAccount | null;
  onShowQR: () => void;
};

export default function UserScanHistory({ activeTab, onTabChange, resident, onShowQR }: UserScanHistoryProps) {
  const [filter, setFilter] = useState("all");
  const [transactions, setTransactions] = useState<DispenseTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    if (!resident?.uid) {
      setTransactions([]);
      return;
    }

    let cancelled = false;
    setLoadingTransactions(true);

    void fetchResidentTransactions(resident.uid)
      .then((items) => {
        if (!cancelled) {
          setTransactions(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTransactions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTransactions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resident?.uid]);

  const filtered = useMemo(
    () => transactions.filter((tx) => matchesFilter(tx.createdAt, filter)),
    [filter, transactions],
  );

  const grouped = useMemo(() => filtered.reduce((acc, tx) => {
    const label = formatDateLabel(tx.createdAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(tx);
    return acc;
  }, {} as Record<string, DispenseTransaction[]>), [filtered]);

  const totalLiters = filtered.reduce((sum, tx) => sum + tx.liters, 0);
  const totalSpent = filtered.reduce((sum, tx) => sum + tx.totalPaid, 0);

  const handleDownload = () => {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resident-transactions-${filter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background">
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
        <div className="flex justify-center gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`shrink-0 px-5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                filter === item.id
                  ? "bg-[#003366] text-white border-[#003366]"
                  : "bg-white text-slate-500 border-slate-200 active:scale-95"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDownload}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 bg-[#003366] text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Download
          </button>
        </div>

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
            <p className="text-xl font-black font-headline text-[#003366]">₱{totalSpent.toFixed(2)}</p>
          </div>
        </div>

        {loadingTransactions && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/10 text-sm text-slate-400">
            Loading your live transactions...
          </div>
        )}

        {!loadingTransactions && Object.entries(grouped).map(([date, txs]) => (
          <section key={date} className="space-y-3">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              {date}
            </p>
            {txs.map((tx) => (
              <div key={tx.id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-outline-variant/10 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#003366] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white icon-fill text-[22px]">local_gas_station</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface leading-tight">{tx.stationName || "Unknown Station"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatDateLabel(tx.createdAt)} · {formatTimeLabel(tx.createdAt)}
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
          </section>
        ))}

        {!loadingTransactions && filtered.length === 0 && (
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

