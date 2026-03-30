import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

const staticGroups = [
  {
    title: "Station",
    items: [
      { icon: "local_gas_station", label: "Active Station", value: "Shell – Fuente Osmeña" },
      { icon: "swap_horiz", label: "Switch Station", value: "", action: "switch" },
    ],
  },
  {
    title: "App",
    items: [
      { icon: "info", label: "Version", value: "1.0.0" },
      { icon: "policy", label: "Privacy Policy", value: "", action: "policy" },
    ],
  },
];

export default function Settings({ officer, activeTab, onTabChange, onLogout }) {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 px-6 pb-36 pt-6 max-w-2xl mx-auto w-full space-y-6">
        <h2 className="text-lg font-headline font-extrabold text-primary">Settings</h2>

        {/* Officer profile card */}
        {officer && (
          <div className="bg-primary-container rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white" style={{ fontSize: "28px", fontVariationSettings: "'FILL' 1" }}>
                manage_accounts
              </span>
            </div>
            <div>
              <p className="text-on-primary-container text-[10px] font-bold uppercase tracking-wider">Station Officer</p>
              <p className="text-white font-headline font-extrabold text-lg leading-tight">
                {officer.firstName} {officer.lastName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-tertiary-fixed" style={{ fontSize: "13px" }}>directions_car</span>
                <span className="text-on-primary-container text-xs font-bold tracking-widest">{officer.plate}</span>
              </div>
            </div>
          </div>
        )}

        {/* Static groups */}
        {staticGroups.map((group) => (
          <section key={group.title} className="space-y-2">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
              {group.title}
            </p>
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
              {group.items.map((item, i) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface-container-low active:bg-surface-container ${
                    i < group.items.length - 1 ? "border-b border-outline-variant/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-xl text-[#003366]">{item.icon}</span>
                    <span className="text-sm font-medium text-on-surface">{item.label}</span>
                  </div>
                  {item.value ? (
                    <span className="text-xs text-on-surface-variant">{item.value}</span>
                  ) : (
                    <span className="material-symbols-outlined text-outline text-sm">chevron_right</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* Account section with logout */}
        <section className="space-y-2">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">Account</p>
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
            <button className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface-container-low border-b border-outline-variant/30">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-xl text-[#003366]">lock</span>
                <span className="text-sm font-medium text-on-surface">Change PIN</span>
              </div>
              <span className="material-symbols-outlined text-outline text-sm">chevron_right</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-5 py-4 transition-colors hover:bg-error-container/20 active:bg-error-container/30"
            >
              <span className="material-symbols-outlined text-xl text-error">logout</span>
              <span className="text-sm font-medium text-error">Sign Out</span>
            </button>
          </div>
        </section>

        <p className="text-center text-outline text-[10px] pt-2">
          © 2024 Cebu City Government · LGU Fuel Management System
        </p>
      </main>
      <BottomNav active={activeTab} onChange={onTabChange} />
    </div>
  );
}
