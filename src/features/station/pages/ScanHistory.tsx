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

const DESKTOP_NAV = [
  { id: "dashboard", label: "Dashboard",   icon: "dashboard" },
  { id: "history",   label: "Transaction", icon: "receipt_long" },
  { id: "settings",  label: "Account",     icon: "manage_accounts" },
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

export default function ScanHistory({ officer, activeTab, onTabChange, onScan, onLogout }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);

  const officerName = officer?.officerFirstName || officer?.firstName || "Officer";
  const brand = officer?.brand || "Station";
  const stationCode = officer?.stationCode || "N/A";

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
    <div className="flex min-h-dvh bg-[#eef2f7]">

      {/* ── Desktop Sidebar ──────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-52 lg:w-60 shrink-0 sticky top-0 h-screen"
        style={{ background: "linear-gradient(180deg, #0a1628 0%, #0d2a5e 100%)" }}>
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
            <h1 className="font-headline font-black text-[#003366] text-xl leading-none">Transaction History</h1>
            <p className="text-xs text-slate-400 mt-1">{brand} · Station Records</p>
          </div>
          <div className="flex items-center gap-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Dispensed",  value: `${totalDispensed.toFixed(1)} L`, icon: "local_gas_station", iconBg: "bg-blue-50",   iconColor: "text-blue-600",   valColor: "text-blue-700" },
              { label: "Transactions",     value: `${filtered.length}`,             icon: "receipt_long",      iconBg: "bg-amber-50",  iconColor: "text-amber-600",  valColor: "text-amber-700" },
              { label: "Total Revenue",    value: `₱${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: "payments", iconBg: "bg-green-50", iconColor: "text-green-600", valColor: "text-green-700" },
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

          {/* Transaction list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
              <h2 className="font-headline font-black text-[#003366] text-base shrink-0">Records</h2>
              <div className="flex items-center gap-2 ml-auto">
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => { setActiveFilter(f.id); setPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        activeFilter === f.id
                          ? "bg-[#003366] text-white shadow"
                          : "text-slate-500 hover:text-[#003366]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => downloadCSV(filtered, currentFilter.label)}
                  className="flex items-center gap-1.5 bg-[#003366] text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>
                  Download
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {Object.entries(grouped).map(([date, txs]) => (
                <div key={date}>
                  <p className="px-6 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50">{date}</p>
                  {txs.map((tx) => {
                    const theme = fuelTypeTheme(tx.type);
                    const totalPrice = Math.round(tx.liters * tx.pricePerLiter * 100) / 100;
                    return (
                      <div key={tx.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#003366]">
                          <span className="text-white font-headline font-black text-xs">{nameInitials(tx.name)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800">{tx.plate} <span className="font-medium text-slate-400">({tx.vehicleType})</span></p>
                          <p className="text-[11px] text-slate-400">{tx.name} · {tx.time}</p>
                        </div>
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase"
                          style={{ background: theme.soft, color: theme.text }}>{tx.type}</span>
                        <div className="text-right shrink-0 w-28">
                          <p className="text-sm font-black text-[#003366]">{tx.liters.toFixed(1)} L</p>
                          <p className="text-[10px] text-slate-400">₱{tx.pricePerLiter.toFixed(2)}/L</p>
                        </div>
                        <div className="text-right shrink-0 w-24">
                          <p className="text-sm font-black text-[#003366]">₱{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <span className="material-symbols-outlined text-4xl">inbox</span>
                  <p className="text-sm font-bold">No records for this period</p>
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 bg-white text-[#003366] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_left</span>
                  Prev
                </button>
                <p className="text-xs font-bold text-slate-400">Page {page} of {totalPages}</p>
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
          </div>
        </main>
      </div>

      {/* ── Mobile Layout ────────────────────────────────────────────────────── */}
      <div className="flex md:hidden flex-col flex-1">
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
    </div>
  );
}

