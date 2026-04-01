import BottomNav from "../components/BottomNav";

const history = [
  { id: 1,  name: "Rico Blanco",          plate: "GAE-1234", time: "10:24 AM", date: "Today",     liters: 15.0, type: "Regular" },
  { id: 2,  name: "Maria Clara Santos",   plate: "YHM-8890", time: "09:45 AM", date: "Today",     liters: 20.0, type: "Diesel" },
  { id: 3,  name: "Juan Dela Cruz",       plate: "ABC-5678", time: "08:12 AM", date: "Today",     liters: 8.5,  type: "Premium" },
  { id: 4,  name: "Lorna Villanueva",     plate: "PQR-3310", time: "07:10 AM", date: "Today",     liters: 10.5, type: "Regular" },
  { id: 5,  name: "Ramon Castillo",       plate: "STU-7721", time: "06:58 AM", date: "Today",     liters: 18.0, type: "Premium" },
  { id: 6,  name: "Ana Reyes",            plate: "XYZ-9900", time: "03:30 PM", date: "Yesterday", liters: 12.0, type: "Regular" },
  { id: 7,  name: "Carlos Fernandez",     plate: "LMN-4412", time: "01:15 PM", date: "Yesterday", liters: 20.0, type: "Diesel" },
  { id: 8,  name: "Grace Tolentino",      plate: "VWX-6650", time: "11:40 AM", date: "Yesterday", liters: 15.0, type: "Diesel" },
  { id: 9,  name: "Eduardo Mendoza",      plate: "BCD-1133", time: "10:20 AM", date: "Yesterday", liters: 9.0,  type: "Regular" },
  { id: 10, name: "Felisa Bautista",      plate: "EFG-2244", time: "09:05 AM", date: "Yesterday", liters: 20.0, type: "Regular" },
  { id: 11, name: "Rommel Aquino",        plate: "HIJ-5566", time: "04:50 PM", date: "March 28",  liters: 14.5, type: "Diesel" },
  { id: 12, name: "Teresita Magbanua",    plate: "KLM-8877", time: "03:35 PM", date: "March 28",  liters: 11.0, type: "Premium" },
  { id: 13, name: "Bernardo Ocampo",      plate: "NOP-1122", time: "02:10 PM", date: "March 28",  liters: 17.0, type: "Regular" },
  { id: 14, name: "Shirley Pangilinan",   plate: "QRS-4455", time: "01:00 PM", date: "March 28",  liters: 20.0, type: "Diesel" },
  { id: 15, name: "Vicente Soriano",      plate: "TUV-7788", time: "11:30 AM", date: "March 28",  liters: 6.5,  type: "Premium" },
];

export default function ScanHistory({ officer, activeTab, onTabChange }) {
  const managerName = officer?.officerFirstName || officer?.firstName || "Manager";
  const brand = officer?.brand || "Station";

  const grouped = history.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {} as Record<string, typeof history>);

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Profile bar */}
      <div className="mx-4 mt-5 mb-2 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-outline-variant/20">
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
      <main className="flex-1 px-6 pb-36 pt-4 max-w-2xl mx-auto w-full space-y-6">
        <h2 className="text-lg font-headline font-extrabold text-primary">Scan History</h2>
        {Object.entries(grouped).map(([date, txs]) => (
          <section key={date} className="space-y-3">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{date}</p>
            {txs.map((tx) => (
              <div
                key={tx.id}
                className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary-container/30 flex items-center justify-center text-on-secondary-container">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{tx.name}</p>
                    <p className="text-[10px] font-medium text-on-surface-variant">
                      {tx.plate} • {tx.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-primary">{tx.liters.toFixed(1)} L</p>
                  <p className="text-[9px] font-bold text-tertiary uppercase">{tx.type}</p>
                </div>
              </div>
            ))}
          </section>
        ))}
      </main>
      <BottomNav active={activeTab} onChange={onTabChange} />
    </div>
  );
}
