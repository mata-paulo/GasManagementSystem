import BottomNav from "../components/BottomNav";

export default function UserDashboard({
  resident,
  activeTab,
  onTabChange,
  onShowQR,
}) {
  const fullName = resident
    ? `${resident.firstName || ""} ${resident.lastName || ""}`.trim()
    : "Resident User";

  const plate = resident?.plate || "N/A";
  const barangay = resident?.barangay || "Not set";
  const vehicleType = resident?.vehicleType || "car";

  const weeklyAllocation = 20;
  const usedLiters = 8;
  const remainingLiters = Math.max(weeklyAllocation - usedLiters, 0);
  const usagePercent = Math.min((usedLiters / weeklyAllocation) * 100, 100);

  const recentTransactions = [
    {
      id: 1,
      station: "Shell - Fuente Osmeña",
      date: "March 30, 2026",
      liters: 4.0,
      fuelType: "Regular",
    },
    {
      id: 2,
      station: "Petron - Jones",
      date: "March 27, 2026",
      liters: 2.5,
      fuelType: "Regular",
    },
    {
      id: 3,
      station: "Caltex - Mango",
      date: "March 24, 2026",
      liters: 1.5,
      fuelType: "Diesel",
    },
  ];

  const announcements = [
    "Weekly allocation refreshes every Monday.",
    "Bring your QR code and a valid ID when claiming fuel.",
    "Station verification is required before successful redemption.",
  ];

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <main className="flex-1 px-6 pt-6 pb-32 max-w-2xl mx-auto w-full space-y-6">
        {/* Welcome Card */}
        <section className="relative overflow-hidden rounded-3xl bg-primary-container p-6 text-white shadow-xl">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 L20 0 M20 40 L40 20 M0 0 L40 40' stroke='%23ffffff' stroke-width='1' fill='none'/%3E%3C/svg%3E\")",
            }}
          />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70 font-bold">
                Resident Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-headline font-black leading-tight">
                Welcome, {fullName}
              </h1>
              <p className="mt-2 text-sm text-white/80">
                Manage your fuel allocation, view your QR code, and check your usage history.
              </p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
              <span
                className="material-symbols-outlined text-tertiary-fixed"
                style={{ fontSize: "30px", fontVariationSettings: "'FILL' 1" }}
              >
                local_gas_station
              </span>
            </div>
          </div>
        </section>

        {/* QR and Status */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  My QR Code
                </p>
                <h2 className="text-lg font-headline font-extrabold text-primary mt-1">
                  Quick Access
                </h2>
              </div>

              <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-white"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  qr_code_2
                </span>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant mb-4">
              Show this QR code at the station to validate your allocation.
            </p>

            <button
              onClick={onShowQR}
              className="w-full bg-primary-container text-white font-headline font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">qr_code</span>
              View My QR
            </button>
          </div>

          <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Allocation Status
                </p>
                <h2 className="text-lg font-headline font-extrabold text-primary mt-1">
                  {remainingLiters.toFixed(1)} L Left
                </h2>
              </div>

              <div className="w-12 h-12 rounded-xl bg-tertiary/15 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-tertiary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  inventory_2
                </span>
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between text-xs font-medium text-on-surface-variant">
              <span>Used: {usedLiters.toFixed(1)} L</span>
              <span>Total: {weeklyAllocation.toFixed(1)} L</span>
            </div>

            <div className="h-3 w-full rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-container transition-all duration-300"
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            <p className="mt-3 text-xs text-on-surface-variant">
              Your allocation resets on the next cycle.
            </p>
          </div>
        </section>

        {/* User Details */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-surface-container-low p-5 space-y-2">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">directions_car</span>
              <span className="text-[11px] font-bold uppercase tracking-tight">
                Vehicle
              </span>
            </div>
            <p className="text-xl font-black font-headline text-primary uppercase">
              {plate}
            </p>
            <p className="text-xs text-on-surface-variant capitalize">
              {vehicleType}
            </p>
          </div>

          <div className="rounded-2xl bg-surface-container-low p-5 space-y-2">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">location_on</span>
              <span className="text-[11px] font-bold uppercase tracking-tight">
                Barangay
              </span>
            </div>
            <p className="text-xl font-black font-headline text-primary">
              {barangay}
            </p>
            <p className="text-xs text-on-surface-variant">
              Registered location
            </p>
          </div>

          <div className="rounded-2xl bg-surface-container-low p-5 space-y-2">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span className="text-[11px] font-bold uppercase tracking-tight">
                Account Status
              </span>
            </div>
            <p className="text-xl font-black font-headline text-green-700">
              Active
            </p>
            <p className="text-xs text-on-surface-variant">
              Eligible for validation
            </p>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-headline font-bold text-on-surface-variant uppercase tracking-wider">
              Recent Fuel Activity
            </h3>
            <button className="text-xs font-bold text-primary-container hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between transition-all hover:bg-surface-container-low border border-outline-variant/10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary-container/30 flex items-center justify-center text-on-secondary-container">
                    <span className="material-symbols-outlined">local_gas_station</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{tx.station}</p>
                    <p className="text-[10px] font-medium text-on-surface-variant">
                      {tx.date} • {tx.fuelType}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black text-primary">
                    {tx.liters.toFixed(1)} L
                  </p>
                  <p className="text-[9px] font-bold text-tertiary uppercase">
                    Dispensed
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Announcements */}
        <section className="space-y-4">
          <h3 className="text-sm font-headline font-bold text-on-surface-variant uppercase tracking-wider">
            Announcements
          </h3>

          <div className="space-y-3">
            {announcements.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl bg-tertiary-fixed/30 border-l-4 border-tertiary p-4 flex gap-3"
              >
                <span className="material-symbols-outlined text-tertiary shrink-0">
                  campaign
                </span>
                <p className="text-sm text-on-tertiary-fixed-variant">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav active={activeTab} onChange={onTabChange} />
    </div>
  );
}