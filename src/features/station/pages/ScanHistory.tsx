import { useState } from "react";
import BottomNav from "@/shared/components/navigation/BottomNav";

const history = [
  { id: 1,  name: "Rico Blanco",          plate: "GAE-1234", vehicleType: "Car",        time: "10:24 AM", date: "Today",     liters: 15.0, type: "Regular/Unleaded (91)",  pricePerLiter: 72.5 },
  { id: 2,  name: "Maria Clara Santos",   plate: "YHM-8890", vehicleType: "Car",        time: "09:45 AM", date: "Today",     liters: 20.0, type: "Diesel",                  pricePerLiter: 68.25 },
  { id: 3,  name: "Juan Dela Cruz",       plate: "ABC-5678", vehicleType: "Motorcycle", time: "08:12 AM", date: "Today",     liters: 8.5,  type: "Premium (95)",            pricePerLiter: 75.9 },
  { id: 4,  name: "Lorna Villanueva",     plate: "PQR-3310", vehicleType: "Motorcycle", time: "07:10 AM", date: "Today",     liters: 10.5, type: "Regular/Unleaded (91)",  pricePerLiter: 72.5 },
  { id: 5,  name: "Ramon Castillo",       plate: "STU-7721", vehicleType: "Car",        time: "06:58 AM", date: "Today",     liters: 18.0, type: "Premium (95)",            pricePerLiter: 75.9 },
  { id: 6,  name: "Ana Reyes",            plate: "XYZ-9900", vehicleType: "Motorcycle", time: "03:30 PM", date: "Yesterday", liters: 12.0, type: "Regular/Unleaded (91)",  pricePerLiter: 72.5 },
  { id: 7,  name: "Carlos Fernandez",     plate: "LMN-4412", vehicleType: "Truck",      time: "01:15 PM", date: "Yesterday", liters: 20.0, type: "Premium Diesel",          pricePerLiter: 70.1 },
  { id: 8,  name: "Grace Tolentino",      plate: "VWX-6650", vehicleType: "Car",        time: "11:40 AM", date: "Yesterday", liters: 15.0, type: "Diesel",                  pricePerLiter: 68.25 },
  { id: 9,  name: "Eduardo Mendoza",      plate: "BCD-1133", vehicleType: "Truck",      time: "10:20 AM", date: "Yesterday", liters: 9.0,  type: "Regular/Unleaded (91)",  pricePerLiter: 72.5 },
  { id: 10, name: "Felisa Bautista",      plate: "EFG-2244", vehicleType: "Car",        time: "09:05 AM", date: "Yesterday", liters: 20.0, type: "Super Premium (97)",      pricePerLiter: 78.4 },
  { id: 11, name: "Rommel Aquino",        plate: "HIJ-5566", vehicleType: "Truck",      time: "04:50 PM", date: "March 28",  liters: 14.5, type: "Premium Diesel",          pricePerLiter: 70.1 },
  { id: 12, name: "Teresita Magbanua",    plate: "KLM-8877", vehicleType: "Motorcycle", time: "03:35 PM", date: "March 28",  liters: 11.0, type: "Premium (95)",            pricePerLiter: 75.9 },
  { id: 13, name: "Bernardo Ocampo",      plate: "NOP-1122", vehicleType: "Car",        time: "02:10 PM", date: "March 28",  liters: 17.0, type: "Regular/Unleaded (91)",  pricePerLiter: 72.5 },
  { id: 14, name: "Shirley Pangilinan",   plate: "QRS-4455", vehicleType: "Car",        time: "01:00 PM", date: "March 28",  liters: 20.0, type: "Diesel",                  pricePerLiter: 68.25 },
  { id: 15, name: "Vicente Soriano",      plate: "TUV-7788", vehicleType: "Truck",      time: "11:30 AM", date: "March 28",  liters: 6.5,  type: "Premium (95)",            pricePerLiter: 75.9 },
];

const FILTERS = [
  { id: "all",   label: "All",        dates: null },
  { id: "today", label: "Today",      dates: ["Today"] },
  { id: "week",  label: "This Week",  dates: ["Today", "Yesterday", "March 28"] },
  { id: "month", label: "This Month", dates: ["Today", "Yesterday", "March 28"] },
];

function nameInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function fuelTypeTheme(fuelType: string) {
  const n = fuelType.toLowerCase();
  if (n.includes("premium diesel")) return { soft: "#dcfce7", text: "#166534" };
  if (n.includes("diesel"))         return { soft: "#f1f5f9", text: "#475569" };
  if (n.includes("regular") || n.includes("unleaded")) return { soft: "#fefce8", text: "#854d0e" };
  if (n.includes("super premium"))  return { soft: "#eff6ff", text: "#1d4ed8" };
  if (n.includes("premium"))        return { soft: "#fee2e2", text: "#991b1b" };
  return { soft: "#f1f5f9", text: "#475569" };
}

function downloadCSV(data: typeof history, filterLabel: string) {
  const headers = ["Name", "Plate", "Vehicle Type", "Date", "Time", "Fuel Type", "Liters", "Price/L", "Total"];
  const rows = data.map((tx) => {
    const total = (tx.liters * tx.pricePerLiter).toFixed(2);
    return [tx.name, tx.plate, tx.vehicleType, tx.date, tx.time, tx.type, tx.liters.toFixed(1), tx.pricePerLiter.toFixed(2), total];
  });
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scan-history-${filterLabel.toLowerCase().replace(/\s/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 10;

export default function ScanHistory({ officer, activeTab, onTabChange, onScan }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);

  const currentFilter = FILTERS.find((f) => f.id === activeFilter)!;
  const filtered = currentFilter.dates
    ? history.filter((tx) => currentFilter.dates!.includes(tx.date))
    : history;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalDispensed = filtered.reduce((sum, tx) => sum + tx.liters, 0);
  const totalRevenue = filtered.reduce((sum, tx) => sum + tx.liters * tx.pricePerLiter, 0);

  const grouped = paginated.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {} as Record<string, typeof history>);

  return (
    <div className="flex flex-col min-h-dvh bg-[#eef2f7]">
      <main className="flex-1 px-4 pb-36 pt-5 max-w-2xl mx-auto w-full space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-headline font-black text-[#003366] uppercase tracking-wider">Scan History</h2>
          <button
            onClick={() => downloadCSV(filtered, currentFilter.label)}
            className="flex items-center gap-1.5 bg-[#003366] text-white text-xs font-black uppercase tracking-wider px-3 py-2 rounded-xl active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>
            Download
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setActiveFilter(f.id); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                activeFilter === f.id
                  ? "bg-[#003366] text-white"
                  : "bg-white text-slate-500 border border-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats bar */}
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
            <p className="font-headline font-black text-[#003366] text-lg leading-tight mt-0.5">₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        {/* Transaction groups */}
        {Object.entries(grouped).map(([date, txs]) => (
          <section key={date} className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{date}</p>
            {txs.map((tx) => {
              const theme = fuelTypeTheme(tx.type);
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
                        style={{ background: theme.soft, color: theme.text }}
                        title={tx.type}
                      >
                        {tx.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 max-w-[50%]">
                    <p className="text-base font-black text-[#003366]">{tx.liters.toFixed(1)} L</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">₱{tx.pricePerLiter.toFixed(2)}/L</p>
                    <p className="text-sm font-black text-[#003366] mt-1">
                      ₱{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              );
            })}
          </section>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <span className="material-symbols-outlined text-4xl">inbox</span>
            <p className="text-sm font-bold">No records for this period</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 bg-white text-[#003366] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_left</span>
              Prev
            </button>
            <p className="text-xs font-bold text-slate-400">
              Page {page} of {totalPages}
            </p>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
  );
}
