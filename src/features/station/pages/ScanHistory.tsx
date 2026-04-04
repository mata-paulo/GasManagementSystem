import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/shared/components/navigation/BottomNav";
import StationDesktopSidebar from "@/shared/components/navigation/StationDesktopSidebar";
import {
  fetchStationTransactions,
  type DispenseTransaction,
  type StationAccount,
} from "@/lib/data/agas";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
] as const;

const DESKTOP_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "history", label: "Transaction", icon: "receipt_long" },
  { id: "settings", label: "Account", icon: "manage_accounts" },
];

const PAGE_SIZE = 12;

type ScanHistoryProps = {
  officer: StationAccount | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onScan: () => void;
  onLogout: () => void;
};

type FilterId = (typeof FILTERS)[number]["id"];

function nameInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function fuelTypeTheme(fuelType: string) {
  const normalized = fuelType.toLowerCase();
  if (normalized.includes("premium diesel")) return { soft: "#dcfce7", text: "#166534" };
  if (normalized.includes("diesel")) return { soft: "#f1f5f9", text: "#475569" };
  if (normalized.includes("regular") || normalized.includes("unleaded")) return { soft: "#fefce8", text: "#854d0e" };
  if (normalized.includes("super premium")) return { soft: "#eff6ff", text: "#1d4ed8" };
  if (normalized.includes("premium")) return { soft: "#fee2e2", text: "#991b1b" };
  return { soft: "#f1f5f9", text: "#475569" };
}

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

function getTransactionDate(transaction: DispenseTransaction): Date | null {
  return transaction.createdAt ?? transaction.occurredAt;
}

function matchesFilter(date: Date | null, filter: FilterId): boolean {
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
  const headers = ["Resident", "Plate", "Vehicle", "Date", "Time", "Fuel Type", "Liters", "Price/L", "Total"];
  const rows = transactions.map((tx) => {
    const date = getTransactionDate(tx);
    return [
      tx.residentName || "Unknown Resident",
      tx.plate || "N/A",
      tx.vehicleType || "N/A",
      formatDateLabel(date),
      formatTimeLabel(date),
      tx.fuelType,
      tx.liters.toFixed(1),
      tx.pricePerLiter.toFixed(2),
      tx.totalPaid.toFixed(2),
    ];
  });

  return [headers, ...rows]
    .map((row) => row.map((value) => `"${value}"`).join(","))
    .join("\n");
}

function downloadCSV(transactions: DispenseTransaction[], label: string): void {
  const csv = toCsv(transactions);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `station-scan-history-${label.toLowerCase().replace(/\s+/g, "-")}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ScanHistory({
  officer,
  activeTab,
  onTabChange,
  onScan,
  onLogout,
}: ScanHistoryProps) {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<DispenseTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const officerName = officer?.officerFirstName || officer?.firstName || "Officer";
  const brand = officer?.brand || "Station";
  const stationCode = officer?.stationCode || "N/A";

  useEffect(() => {
    if (!officer?.uid) {
      setTransactions([]);
      return;
    }

    let cancelled = false;
    setLoadingTransactions(true);

    void fetchStationTransactions(officer.uid)
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
  }, [officer?.uid]);

  const currentFilter = FILTERS.find((filter) => filter.id === activeFilter) ?? FILTERS[0];

  const filtered = useMemo(
    () => transactions.filter((tx) => matchesFilter(getTransactionDate(tx), activeFilter)),
    [activeFilter, transactions],
  );

  useEffect(() => {
    setPage(1);
  }, [activeFilter, transactions.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const totalDispensed = useMemo(
    () => filtered.reduce((sum, tx) => sum + tx.liters, 0),
    [filtered],
  );

  const totalRevenue = useMemo(
    () => filtered.reduce((sum, tx) => sum + tx.totalPaid, 0),
    [filtered],
  );

  const grouped = useMemo(() => paginated.reduce((acc, tx) => {
    const label = formatDateLabel(getTransactionDate(tx));
    if (!acc[label]) acc[label] = [];
    acc[label].push(tx);
    return acc;
  }, {} as Record<string, DispenseTransaction[]>), [paginated]);

  const groupedEntries = useMemo(
    () => Object.entries(grouped) as Array<[string, DispenseTransaction[]]>,
    [grouped],
  );

  return (
    <div className="flex min-h-dvh bg-[#eef2f7]">

      <StationDesktopSidebar activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} />

      <div className="hidden md:flex flex-col flex-1 overflow-hidden bg-[#f1f5f9]">
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shrink-0">
          <div>
            <h1 className="font-headline font-black text-[#003366] text-xl leading-none">Transaction History</h1>
            <p className="text-xs text-slate-400 mt-1">{brand} · Station Records</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onScan}
              title="Scan QR Code"
              className="flex items-center justify-center bg-[#003366] text-white w-10 h-10 rounded-xl shadow active:scale-95 transition-all"
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                qr_code_scanner
              </span>
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

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Total Dispensed",
                value: `${totalDispensed.toFixed(1)} L`,
                icon: "local_gas_station",
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
                valColor: "text-blue-700",
              },
              {
                label: "Transactions",
                value: `${filtered.length}`,
                icon: "receipt_long",
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
                valColor: "text-amber-700",
              },
              {
                label: "Total Revenue",
                value: `PHP ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                icon: "payments",
                iconBg: "bg-green-50",
                iconColor: "text-green-600",
                valColor: "text-green-700",
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                    <span
                      className={`material-symbols-outlined ${stat.iconColor} text-[20px]`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {stat.icon}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight">{stat.label}</p>
                </div>
                <p className={`text-3xl font-black font-headline ${stat.valColor}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
              <h2 className="font-headline font-black text-[#003366] text-base shrink-0">Records</h2>
              <div className="flex items-center gap-2 ml-auto">
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                  {FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => {
                        setActiveFilter(filter.id);
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        activeFilter === filter.id
                          ? "bg-[#003366] text-white shadow"
                          : "text-slate-500 hover:text-[#003366]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => downloadCSV(filtered, currentFilter.label)}
                  disabled={filtered.length === 0}
                  className="flex items-center gap-1.5 bg-[#003366] text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>
                  Download
                </button>
              </div>
            </div>

            {loadingTransactions && (
              <div className="px-6 py-4 text-sm text-slate-400">Loading live station transactions...</div>
            )}

            <div className="divide-y divide-slate-50">
              {groupedEntries.map(([date, txs]) => (
                <div key={date}>
                  <p className="px-6 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50">{date}</p>
                  {txs.map((tx) => {
                    const theme = fuelTypeTheme(tx.fuelType);
                    const transactionDate = getTransactionDate(tx);
                    const totalPrice = Math.round(tx.totalPaid * 100) / 100;
                    return (
                      <div key={tx.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#003366]">
                          <span className="text-white font-headline font-black text-xs">
                            {nameInitials(tx.residentName || tx.plate || "Resident")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800">
                            {tx.plate || "N/A"} <span className="font-medium text-slate-400">({tx.vehicleType || "Vehicle"})</span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {tx.residentName || "Unknown Resident"} · {formatTimeLabel(transactionDate)}
                          </p>
                        </div>
                        <span
                          className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase"
                          style={{ background: theme.soft, color: theme.text }}
                        >
                          {tx.fuelType}
                        </span>
                        <div className="text-right shrink-0 w-28">
                          <p className="text-sm font-black text-[#003366]">{tx.liters.toFixed(1)} L</p>
                          <p className="text-[10px] text-slate-400">PHP {tx.pricePerLiter.toFixed(2)}/L</p>
                        </div>
                        <div className="text-right shrink-0 w-24">
                          <p className="text-sm font-black text-[#003366]">
                            PHP {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {!loadingTransactions && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <span className="material-symbols-outlined text-4xl">inbox</span>
                  <p className="text-sm font-bold">No records for this period</p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <button
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 bg-white text-[#003366] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_left</span>
                  Prev
                </button>
                <p className="text-xs font-bold text-slate-400">Page {page} of {totalPages}</p>
                <button
                  onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 bg-white text-[#003366] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  Next
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <div className="flex md:hidden flex-col flex-1">
        <main className="flex-1 px-4 pb-36 pt-5 max-w-2xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-headline font-black text-[#003366] uppercase tracking-wider">Scan History</h2>
            <button
              onClick={() => downloadCSV(filtered, currentFilter.label)}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 bg-[#003366] text-white text-xs font-black uppercase tracking-wider px-3 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>
              Download
            </button>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  setActiveFilter(filter.id);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                  activeFilter === filter.id
                    ? "bg-[#003366] text-white"
                    : "bg-white text-slate-500 border border-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex">
            <div className="flex-1 px-4 py-3 text-center border-r border-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Dispensed</p>
              <p className="font-headline font-black text-[#003366] text-lg leading-tight mt-0.5">{totalDispensed.toFixed(1)} L</p>
            </div>
            <div className="flex-1 px-4 py-3 text-center border-r border-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Transactions</p>
              <p className="font-headline font-black text-[#705d00] text-lg leading-tight mt-0.5">{filtered.length}</p>
            </div>
            <div className="flex-1 px-4 py-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Gained</p>
              <p className="font-headline font-black text-[#003366] text-lg leading-tight mt-0.5">
                PHP {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {loadingTransactions && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-sm text-slate-400">
              Loading live station transactions...
            </div>
          )}

          {groupedEntries.map(([date, txs]) => (
            <section key={date} className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{date}</p>
              {txs.map((tx) => {
                const theme = fuelTypeTheme(tx.fuelType);
                const transactionDate = getTransactionDate(tx);
                const totalPrice = Math.round(tx.totalPaid * 100) / 100;
                return (
                  <div key={tx.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#003366]">
                        <span className="text-white font-headline font-black text-sm tracking-tight">
                          {nameInitials(tx.residentName || tx.plate || "Resident")}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">
                          {tx.plate || "N/A"} <span className="font-medium text-slate-400">({tx.vehicleType || "Vehicle"})</span>
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 truncate">
                          {tx.residentName || "Unknown Resident"} · {formatDateLabel(transactionDate)} · {formatTimeLabel(transactionDate)}
                        </p>
                        <span
                          className="inline-block mt-1 text-[8px] font-black px-2 py-0.5 rounded-full uppercase max-w-full truncate"
                          style={{ background: theme.soft, color: theme.text }}
                          title={tx.fuelType}
                        >
                          {tx.fuelType}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 max-w-[50%]">
                      <p className="text-base font-black text-[#003366]">{tx.liters.toFixed(1)} L</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5">PHP {tx.pricePerLiter.toFixed(2)}/L</p>
                      <p className="text-sm font-black text-[#003366] mt-1">
                        PHP {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </section>
          ))}

          {!loadingTransactions && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <span className="material-symbols-outlined text-4xl">inbox</span>
              <p className="text-sm font-bold">No records for this period</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 bg-white text-[#003366] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_left</span>
                Prev
              </button>
              <p className="text-xs font-bold text-slate-400">Page {page} of {totalPages}</p>
              <button
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 bg-white text-[#003366] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                Next
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span>
              </button>
            </div>
          )}
        </main>

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
    </div>
  );
}
