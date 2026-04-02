import BottomNav from "../components/BottomNav";

const fuelBadgeClass = (type: string) =>
  type === "Diesel" ? "badge-diesel" : type === "Premium" ? "badge-premium" : "badge-regular";

const recentTransactions = [
  { id: 1,  name: "Rico Blanco",          plate: "GAE-1234", time: "10:24 AM", liters: 15.0, type: "Regular" },
  { id: 2,  name: "Maria Clara Santos",   plate: "YHM-8890", time: "09:45 AM", liters: 20.0, type: "Diesel" },
  { id: 3,  name: "Juan Dela Cruz",       plate: "ABC-5678", time: "08:12 AM", liters: 8.5,  type: "Premium" },
  { id: 4,  name: "Ana Reyes",            plate: "XYZ-9900", time: "07:55 AM", liters: 12.0, type: "Regular" },
  { id: 5,  name: "Carlos Fernandez",     plate: "LMN-4412", time: "07:30 AM", liters: 20.0, type: "Diesel" },
  { id: 6,  name: "Lorna Villanueva",     plate: "PQR-3310", time: "07:10 AM", liters: 10.5, type: "Regular" },
  { id: 7,  name: "Ramon Castillo",       plate: "STU-7721", time: "06:58 AM", liters: 18.0, type: "Premium" },
  { id: 8,  name: "Grace Tolentino",      plate: "VWX-6650", time: "06:40 AM", liters: 15.0, type: "Diesel" },
  { id: 9,  name: "Eduardo Mendoza",      plate: "BCD-1133", time: "06:20 AM", liters: 9.0,  type: "Regular" },
  { id: 10, name: "Felisa Bautista",      plate: "EFG-2244", time: "06:05 AM", liters: 20.0, type: "Regular" },
  { id: 11, name: "Rommel Aquino",        plate: "HIJ-5566", time: "05:50 AM", liters: 14.5, type: "Diesel" },
  { id: 12, name: "Teresita Magbanua",    plate: "KLM-8877", time: "05:35 AM", liters: 11.0, type: "Premium" },
];
const MAX_DASHBOARD_TRANSACTIONS = 5;

interface OfficerData {
  officerFirstName?: string;
  firstName?: string;
  stationCode?: string;
  barangay?: string;
  brand?: string;
  capacity?: string | number;
}

export default function Dashboard({ officer, onScan, onEditFuels, activeTab, onTabChange }: {
  officer: OfficerData;
  onScan: () => void;
  onEditFuels?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const managerName = officer?.officerFirstName || officer?.firstName || "Manager";
  const stationCode = officer?.stationCode || "N/A";
  const barangay = officer?.barangay || "Not set";
  const brand = officer?.brand || "Station";
  const rawCapacity = officer?.capacity;
  const capacity = rawCapacity ? String(rawCapacity) : "N/A";
  const fuelCapacities = (officer as any)?.fuelCapacities || {};
  const fuelPrices = (officer as any)?.fuelPrices || {};
  const fuelInventory = (officer as any)?.fuelInventory || {};
  const todayTotal = recentTransactions.slice(0, MAX_DASHBOARD_TRANSACTIONS).reduce((sum, tx) => sum + tx.liters, 0);
  const fuelInventoryCards: Array<[string, number]> = Object.keys(fuelCapacities).length
    ? Object.entries(fuelCapacities)
    : [
        ["Diesel", 0],
        ["Premium Diesel", 0],
        ["Regular/Unleaded (91)", 0],
        ["Premium (95)", 0],
        ["Super Premium (97)", 0],
      ];

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <main className="flex-1 pb-44 max-w-2xl mx-auto w-full">

        {/* Profile bar */}
        <div className="mx-4 mt-5 mb-4 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-outline-variant/20">
          <div className="w-11 h-11 rounded-full border-2 border-[#003366] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#003366] icon-lg">manage_accounts</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-headline font-bold text-[#003366] text-base leading-tight truncate">{managerName}</p>
            <p className="text-xs text-slate-400 font-medium">Station Officer · {brand}</p>
          </div>
          <div className="shrink-0 flex flex-col items-center justify-center bg-[#003366] rounded-xl px-3 py-1.5 gap-0.5">
            <span className="material-symbols-outlined text-yellow-400 icon-filled icon-base">local_gas_station</span>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">Fuel Rationing</span>
          </div>
        </div>

        <div className="px-4 space-y-4">

          {/* Active Station banner — high contrast */}
          <section className="rounded-2xl p-5 shadow-lg flex items-center justify-between bg-[#003366]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Active Station</p>
              <p className="text-white font-headline font-black text-2xl flex items-center gap-2 leading-tight">
                <span className="material-symbols-outlined text-yellow-400 icon-filled icon-lg">local_gas_station</span>
                {brand}
              </p>
              <p className="text-indigo-200/80 text-xs mt-1">Barangay {barangay} · ID: {stationCode}</p>
            </div>
            
            <div className="flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto relative z-10 mt-2 sm:mt-0">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/5 self-start sm:self-end">
                <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-200">Total Capacity</p>
                <p className="text-lg font-black text-white leading-none mt-0.5">{capacity} <span className="text-xs text-indigo-200">L</span></p>
              </div>
              <button
                type="button"
                className="w-full sm:w-auto min-h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 active:scale-[0.98] transition-all duration-300 ease-out flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base shrink-0" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 0" }}>edit</span>
                Fuel &amp; pricing
              </button>
            </div>
            
            {/* Decorative background circle */}
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          </section>

          {/* Stats — dark charcoal */}
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 shadow-sm bg-[#1e293b]">
              <div className="flex items-center gap-1 mb-2">
                <span className="material-symbols-outlined icon-filled icon-sm text-[#f9c23c]">inventory_2</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#94a3b8]">Weekly Limit</span>
              </div>
              <p className="text-3xl font-black font-headline text-white leading-none">20</p>
              <p className="text-sm font-bold mt-0.5 text-[#f9c23c]">Liters</p>
              <p className="text-[9px] mt-1 text-[#94a3b8]">Standard allocation</p>
            </div>
            <div className="rounded-2xl p-4 shadow-sm bg-[#1e293b]">
              <div className="flex items-center gap-1 mb-2">
                <span className="material-symbols-outlined icon-filled icon-sm text-[#f9c23c]">local_fire_department</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#94a3b8]">Today's Total</span>
              </div>
              <p className="text-3xl font-black font-headline text-white leading-none">{todayTotal.toFixed(1)}</p>
              <p className="text-sm font-bold mt-0.5 text-[#f9c23c]">Liters</p>
              <p className="text-[9px] mt-1 text-[#94a3b8]">Dispensed today</p>
            </div>
          </section>

          {/* Recent Transactions */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-headline font-black text-[#003366] uppercase tracking-wider">Recent Transactions</h3>
              <button type="button" className="text-xs font-bold text-primary-container hover:underline">View All</button>
            </div>
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#003366]">
                      <span className="material-symbols-outlined text-white icon-filled icon-base">person</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 truncate">{tx.name}</p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {tx.plate} · {tx.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 max-w-[48%]">
                    <p className="text-base font-black text-[#003366]">{tx.liters.toFixed(1)} L</p>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${fuelBadgeClass(tx.type)}`}
                    >
                      {tx.type}
                    </span>
                  </div>
                </div>
              ))}
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
