import BottomNav from "../components/BottomNav";

const APP_VERSION = "V 1.0.0";

const menuItems = [
  { icon: "qr_code", label: "My QR Code", section: "main" },
  { icon: "receipt_long", label: "Fuel Transactions", section: "main" },
  { icon: "inventory_2", label: "Allocation Info", section: "main" },
  { icon: "local_gas_station", label: "Participating Stations", section: "main" },
  { icon: "settings", label: "Settings", section: "main" },
  { icon: "help_outline", label: "Help & Support", section: "support" },
  { icon: "info", label: "About the App", section: "support" },
  { icon: "policy", label: "Privacy Policy", section: "support" },
];

const USER_TABS = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "user-history", icon: "receipt_long", label: "Scan History" },
  { id: "map", icon: "map", label: "Map" },
  { id: "settings", icon: "account_circle", label: "Account" },
];

export default function Settings({ officer, activeTab, onTabChange, onLogout, tabs }) {
  const name = officer
    ? `${officer.firstName || ""} ${officer.lastName || ""}`.trim()
    : "Station Officer";

  const grouped = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const sectionLabels = { main: "Account", support: "Support" };

  return (
    <div className="flex flex-col min-h-dvh bg-[#f5f5f5]">
      <main className="flex-1 pb-36 max-w-2xl mx-auto w-full">

        {/* Profile card */}
        <div className="bg-white mx-4 mt-5 mb-1 rounded-2xl px-5 py-4 shadow-sm border border-outline-variant/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-[#2e7d32] flex items-center justify-center shrink-0 bg-white shadow-sm">
              <span className="material-symbols-outlined text-[#2e7d32]" style={{ fontSize: "28px" }}>
                manage_accounts
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-headline font-black text-[#003366] text-lg leading-tight truncate">
                {name}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                View and edit profile
              </p>
            </div>
          </div>
        </div>

        {/* Menu groups */}
        {Object.entries(grouped).map(([section, items]) => (
          <div key={section} className="mt-5 mx-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
              {sectionLabels[section]}
            </p>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
              {items.map((item, i) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-4 px-5 py-4 transition-colors active:bg-slate-50 ${
                    i < items.length - 1 ? "border-b border-slate-100" : ""
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[#003366]"
                    style={{ fontSize: "22px", fontVariationSettings: "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-800 text-left">
                    {item.label}
                  </span>
                  <span className="material-symbols-outlined text-slate-300" style={{ fontSize: "20px" }}>
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Legal + Version + Sign out */}
        <div className="mt-5 mx-4 bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
          <button className="w-full flex items-center gap-4 px-5 py-4 border-b border-slate-100 active:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-[#003366]" style={{ fontSize: "22px" }}>gavel</span>
            <span className="flex-1 text-sm font-medium text-slate-800 text-left">Legal</span>
            <span className="material-symbols-outlined text-slate-300" style={{ fontSize: "20px" }}>chevron_right</span>
          </button>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[#003366]" style={{ fontSize: "22px" }}>smartphone</span>
              <span className="text-sm font-medium text-slate-800">Software Version</span>
            </div>
            <span className="text-sm font-bold text-slate-400">{APP_VERSION}</span>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-5 py-4 active:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-red-500" style={{ fontSize: "22px" }}>logout</span>
            <span className="flex-1 text-sm font-medium text-red-500 text-left">Sign Out</span>
          </button>
        </div>

        <p className="text-center text-slate-300 text-[10px] pt-5 pb-2">
          © 2024 Mata Technologies Inc. · Fuel Rationing System
        </p>
      </main>

      <BottomNav active={activeTab} onChange={onTabChange} tabs={tabs || undefined} />
    </div>
  );
}
