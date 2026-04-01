import BottomNav from "../components/BottomNav";

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

export default function Dashboard({ officer, onScan, activeTab, onTabChange }) {
  const managerName = officer?.officerFirstName || officer?.firstName || "Manager";
  const stationCode = officer?.stationCode || "N/A";
  const barangay = officer?.barangay || "Not set";
  const brand = officer?.brand || "Station";
  const capacity = officer?.capacity || "N/A";

  const todayTotal = recentTransactions.reduce((s, t) => s + t.liters, 0);

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <main className="flex-1 pb-44 max-w-2xl mx-auto w-full">

        {/* Profile bar */}
        <div className="mx-4 mt-5 mb-4 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-outline-variant/20">
          <div className="w-11 h-11 rounded-full border-2 border-[#003366] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#003366]" style={{ fontSize: "24px" }}>manage_accounts</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-headline font-bold text-[#003366] text-base leading-tight truncate">{managerName}</p>
            <p className="text-xs text-slate-400 font-medium">Station Officer · {brand}</p>
          </div>
          <div className="shrink-0 flex flex-col items-center justify-center bg-[#003366] rounded-xl px-3 py-1.5 gap-0.5">
            <span className="material-symbols-outlined text-yellow-400" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>local_gas_station</span>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">Fuel Rationing</span>
          </div>
        </div>

        <div className="px-4 space-y-4">

          {/* Active Station banner — high contrast */}
          <section className="rounded-2xl p-5 shadow-lg flex items-center justify-between" style={{ background: "#003366" }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Active Station</p>
              <p className="text-white font-headline font-black text-2xl flex items-center gap-2 leading-tight">
                <span className="material-symbols-outlined text-yellow-400" style={{ fontSize: "24px", fontVariationSettings: "'FILL' 1" }}>local_gas_station</span>
                {brand}
              </p>
              <p className="text-white/50 text-xs mt-1">Barangay {barangay} · ID: {stationCode}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-[11px] font-black uppercase">
                Online
              </span>
              <span className="text-white/40 text-[10px]">Cap: {capacity} L</span>
            </div>
          </section>

          {/* Stats — dark charcoal */}
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 shadow-sm" style={{ background: "#1e293b" }}>
              <div className="flex items-center gap-1 mb-2">
                <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#f9c23c", fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#94a3b8" }}>Weekly Limit</span>
              </div>
              <p className="text-3xl font-black font-headline text-white leading-none">20</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: "#f9c23c" }}>Liters</p>
              <p className="text-[9px] mt-1" style={{ color: "#94a3b8" }}>Standard allocation</p>
            </div>
            <div className="rounded-2xl p-4 shadow-sm" style={{ background: "#1e293b" }}>
              <div className="flex items-center gap-1 mb-2">
                <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#f9c23c", fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#94a3b8" }}>Today's Total</span>
              </div>
              <p className="text-3xl font-black font-headline text-white leading-none">{todayTotal.toFixed(1)}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: "#f9c23c" }}>Liters</p>
              <p className="text-[9px] mt-1" style={{ color: "#94a3b8" }}>Dispensed today</p>
            </div>
          </section>

          {/* Recent Transactions */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-headline font-black text-[#003366] uppercase tracking-wider">Recent Transactions</h3>
              <button className="text-xs font-bold text-primary-container hover:underline">View All</button>
            </div>
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#003366" }}>
                      <span className="material-symbols-outlined text-white" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>person</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{tx.name}</p>
                      <p className="text-[10px] font-medium text-slate-400">{tx.plate} · {tx.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-[#003366]">{tx.liters.toFixed(1)} L</p>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase"
                      style={{ background: tx.type === "Diesel" ? "#fff3e0" : tx.type === "Premium" ? "#f3e5f5" : "#e8f5e9",
                               color: tx.type === "Diesel" ? "#e65100" : tx.type === "Premium" ? "#7b1fa2" : "#2e7d32" }}>
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
          onClick={onScan}
          className="pointer-events-auto flex items-center gap-2 bg-[#003366] text-white font-headline font-bold px-6 py-3.5 rounded-full shadow-2xl active:scale-95 transition-all border-2 border-white/20"
          style={{ boxShadow: "0 8px 32px rgba(0,51,102,0.45)" }}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
          Scan QR Code
        </button>
      </div>

      <BottomNav active={activeTab} onChange={onTabChange} />
    </div>
  );
}
