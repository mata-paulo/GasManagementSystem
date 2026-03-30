import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

const recentTransactions = [
  {
    id: 1,
    name: "Rico Blanco",
    plate: "GAE-1234",
    time: "10:24 AM",
    liters: 15.0,
    type: "Regular",
  },
  {
    id: 2,
    name: "Maria Clara Santos",
    plate: "YHM-8890",
    time: "09:45 AM",
    liters: 20.0,
    type: "Diesel",
  },
  {
    id: 3,
    name: "Juan Dela Cruz",
    plate: "ABC-5678",
    time: "08:12 AM",
    liters: 8.5,
    type: "Premium",
  },
];

export default function Dashboard({ officer, onScan, activeTab, onTabChange }) {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />

      <main className="flex-1 px-6 pb-36 pt-6 max-w-2xl mx-auto w-full space-y-8">
        {/* Active Station Banner */}
        {officer && (
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>manage_accounts</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Logged in as</p>
              <p className="text-sm font-bold text-primary">{officer.firstName} {officer.lastName} · {officer.plate}</p>
            </div>
          </div>
        )}

        <section className="relative overflow-hidden rounded-2xl bg-primary-container p-6 text-white shadow-xl">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 L20 0 M20 40 L40 20 M0 0 L40 40' stroke='%23003366' stroke-width='1' fill='none'/%3E%3C/svg%3E\")",
            }}
          />
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-medium text-on-primary-container uppercase tracking-widest">
                Active Station
              </span>
              <h2 className="text-xl font-headline font-extrabold flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-tertiary-fixed"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_gas_station
                </span>
                Shell – Fuente Osmeña
              </h2>
            </div>
            <span className="bg-green-500/20 text-green-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-green-500/30">
              Online
            </span>
          </div>
        </section>

        {/* Current Session */}
        <section className="space-y-4">
          <h3 className="text-sm font-headline font-bold text-on-surface-variant uppercase tracking-wider">
            Current Session
          </h3>
          <div className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-6 shadow-sm border border-outline-variant/10">
            <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center text-outline">
              <span className="material-symbols-outlined text-5xl">
                qr_code_scanner
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-headline font-bold text-on-surface">
                Ready to Register
              </h4>
              <p className="text-sm text-on-surface-variant max-w-[240px]">
                Scan a resident's QR code to verify their fuel allocation
                status.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">
                inventory_2
              </span>
              <span className="text-[11px] font-bold uppercase tracking-tight">
                Allocation Status
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-headline text-primary">
                20
              </span>
              <span className="text-sm font-medium text-primary-container">
                Liters
              </span>
            </div>
            <p className="text-[10px] text-on-surface-variant">
              Standard Weekly Limit
            </p>
          </div>

          <div className="bg-surface-container-low p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">history</span>
              <span className="text-[11px] font-bold uppercase tracking-tight">
                Today's Total
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-headline text-primary">
                142
              </span>
              <span className="text-sm font-medium text-primary-container">
                Liters
              </span>
            </div>
            <p className="text-[10px] text-on-surface-variant">
              Dispensed at this station
            </p>
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-headline font-bold text-on-surface-variant uppercase tracking-wider">
              Recent Transaction History
            </h3>
            <button className="text-xs font-bold text-primary-container hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between transition-all hover:bg-surface-container-low"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary-container/30 flex items-center justify-center text-on-secondary-container">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      {tx.name}
                    </p>
                    <p className="text-[10px] font-medium text-on-surface-variant">
                      {tx.plate} • {tx.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-primary">
                    {tx.liters.toFixed(1)} L
                  </p>
                  <p className="text-[9px] font-bold text-tertiary uppercase">
                    {tx.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Scan FAB */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60]">
        <button
          onClick={onScan}
          className="bg-tertiary text-on-tertiary px-8 py-4 rounded-full shadow-2xl shadow-tertiary/40 flex items-center gap-3 active:scale-95 transition-transform"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            qr_code_scanner
          </span>
          <span className="font-headline font-black uppercase tracking-widest text-sm">
            Scan QR Code
          </span>
        </button>
      </div>

      <BottomNav active={activeTab} onChange={onTabChange} />
    </div>
  );
}
