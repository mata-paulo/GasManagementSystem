import BottomNav from "../components/BottomNav";

const USER_TABS = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "user-history", icon: "receipt_long", label: "Scan History" },
  { id: "map", icon: "map", label: "Map" },
  { id: "settings", icon: "account_circle", label: "Account" },
];

const history = [
  {
    id: 1,
    station: "Shell - Fuente Osmeña",
    date: "March 30, 2026",
    time: "10:24 AM",
    liters: 4.0,
    fuelType: "Regular",
    status: "Dispensed",
  },
  {
    id: 2,
    station: "Petron - Jones",
    date: "March 27, 2026",
    time: "09:45 AM",
    liters: 2.5,
    fuelType: "Regular",
    status: "Dispensed",
  },
  {
    id: 3,
    station: "Caltex - Mango",
    date: "March 24, 2026",
    time: "08:12 AM",
    liters: 1.5,
    fuelType: "Diesel",
    status: "Dispensed",
  },
];

const grouped = history.reduce((acc, tx) => {
  if (!acc[tx.date]) acc[tx.date] = [];
  acc[tx.date].push(tx);
  return acc;
}, {} as Record<string, typeof history>);

export default function UserScanHistory({ activeTab, onTabChange, resident }) {
  const totalLiters = history.reduce((sum, tx) => sum + tx.liters, 0);

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-primary-container shadow-sm sticky top-0 z-40">
        <div>
          <h1 className="text-white font-headline font-bold text-lg leading-none">
            Scan History
          </h1>
          <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-0.5">
            Your fuel transaction records
          </p>
        </div>
        <span className="material-symbols-outlined text-tertiary-fixed ml-auto icon-filled text-[28px]">
          receipt_long
        </span>
      </div>

      <main className="flex-1 px-5 pt-5 pb-36 max-w-2xl mx-auto w-full space-y-5">
        {/* Summary card */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary-container/10 border border-primary-container/20 rounded-2xl p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Total Dispensed
            </p>
            <p className="text-2xl font-black font-headline text-primary-container">
              {totalLiters.toFixed(1)} L
            </p>
          </div>
          <div className="bg-tertiary/10 border border-tertiary/20 rounded-2xl p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Transactions
            </p>
            <p className="text-2xl font-black font-headline text-tertiary">
              {history.length}
            </p>
          </div>
        </div>

        {/* Grouped history */}
        {Object.entries(grouped).map(([date, txs]) => (
          <section key={date} className="space-y-3">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              {date}
            </p>
            {txs.map((tx) => (
              <div
                key={tx.id}
                className="bg-surface-container-lowest border border-outline-variant/10 p-4 rounded-2xl flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary-container/30 flex items-center justify-center text-on-secondary-container shrink-0">
                    <span className="material-symbols-outlined">local_gas_station</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{tx.station}</p>
                    <p className="text-[11px] text-on-surface-variant">
                      {tx.time} • {tx.fuelType}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-primary-container">
                    {tx.liters.toFixed(1)} L
                  </p>
                  <span className="text-[10px] font-bold text-tertiary uppercase">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </section>
        ))}

        {history.length === 0 && (
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

      <BottomNav active={activeTab} onChange={onTabChange} tabs={USER_TABS} />
    </div>
  );
}
