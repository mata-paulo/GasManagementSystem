import BottomNav from "../components/BottomNav";

const APP_VERSION = "V 1.0.0";

const BRAND_LOGO: Record<string, { bg: string; fg: string; abbr: string }> = {
  Shell:      { bg: "#FBCE07", fg: "#DD1D21", abbr: "SH" },
  Petron:     { bg: "#0059A7", fg: "#ffffff", abbr: "PE" },
  Caltex:     { bg: "#C8102E", fg: "#ffffff", abbr: "CX" },
  Phoenix:    { bg: "#F47920", fg: "#ffffff", abbr: "PX" },
  Seaoil:     { bg: "#00677F", fg: "#ffffff", abbr: "SO" },
  "Flying V": { bg: "#8B1A1A", fg: "#ffffff", abbr: "FV" },
  Diatoms:    { bg: "#2E7D32", fg: "#ffffff", abbr: "DI" },
  Default:    { bg: "#003366", fg: "#ffffff", abbr: "⛽" },
};

const DESKTOP_NAV = [
  { id: "dashboard", label: "Dashboard",   icon: "dashboard" },
  { id: "history",   label: "Transaction", icon: "receipt_long" },
  { id: "settings",  label: "Account",     icon: "manage_accounts" },
];

const OFFICER_TABS = [
  { id: "dashboard", icon: "dashboard",    label: "Dashboard" },
  { id: "history",   icon: "receipt_long", label: "Transaction" },
  { id: "settings",  icon: "account_circle", label: "Account" },
];

const menuItems = [
  { icon: "settings",     label: "Settings",       section: "main" },
  { icon: "help_outline", label: "Help & Support",  section: "support" },
  { icon: "info",         label: "About the App",   section: "support" },
  { icon: "policy",       label: "Privacy Policy",  section: "support" },
];

export default function OfficerSettings({ officer, activeTab, onTabChange, onLogout, onChangePassword = undefined }) {
  const name = officer
    ? `${officer.firstName || ""} ${officer.lastName || ""}`.trim() || "Station Officer"
    : "Station Officer";

  const brand = officer?.brand as string | undefined;
  const logo = brand ? (BRAND_LOGO[brand] ?? BRAND_LOGO.Default) : null;
  const stationCode = officer?.stationCode || "N/A";
  const officerName = officer?.officerFirstName || officer?.firstName || "Officer";

  const grouped = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  const sectionLabels: Record<string, string> = { main: "Account", support: "Support" };

  return (
    <div className="flex min-h-dvh bg-[#f5f5f5]">

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
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shrink-0">
          <div>
            <h1 className="font-headline font-black text-[#003366] text-xl leading-none">Account</h1>
            <p className="text-xs text-slate-400 mt-1">{brand ?? "Profile & Settings"}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-bold text-[#003366]">{officerName}</p>
              <p className="text-[10px] text-slate-400">ID: {stationCode}</p>
            </div>
            {logo ? (
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2"
                style={{ background: logo.bg, borderColor: logo.fg + "40" }}>
                <span className="font-headline font-black text-sm" style={{ color: logo.fg }}>{logo.abbr}</span>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#003366] flex items-center justify-center shrink-0">
                <span className="text-white font-black text-sm">{officerName[0]?.toUpperCase() ?? "O"}</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Profile card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
              {logo ? (
                <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2"
                  style={{ background: logo.bg, borderColor: logo.fg + "40" }}>
                  <span className="font-headline font-black text-2xl" style={{ color: logo.fg }}>{logo.abbr}</span>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-[#2e7d32] flex items-center justify-center shrink-0 bg-white shadow-sm">
                  <span className="material-symbols-outlined text-[#2e7d32] text-[32px]">manage_accounts</span>
                </div>
              )}
              <div>
                <p className="font-headline font-black text-[#003366] text-xl leading-tight">{name}</p>
                <p className="text-sm text-slate-400 font-medium mt-0.5">{brand ?? "Station Officer"}</p>
                {stationCode !== "N/A" && (
                  <p className="text-xs text-slate-300 mt-1">Station ID: {stationCode}</p>
                )}
              </div>
            </div>

            {/* Menu groups */}
            {Object.entries(grouped).map(([section, items]) => (
              <div key={section}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                  {sectionLabels[section]}
                </p>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                  {items.map((item, i) => (
                    <button key={item.label}
                      className={`w-full flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50 ${
                        i < items.length - 1 ? "border-b border-slate-100" : ""
                      }`}>
                      <span className="material-symbols-outlined text-[#003366] text-[22px]">{item.icon}</span>
                      <span className="flex-1 text-sm font-medium text-slate-800 text-left">{item.label}</span>
                      <span className="material-symbols-outlined text-slate-300 text-[20px]">chevron_right</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Actions */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
              {onChangePassword && (
                <button onClick={onChangePassword}
                  className="w-full flex items-center gap-4 px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-[#003366] text-[22px]">lock_reset</span>
                  <span className="flex-1 text-sm font-medium text-slate-800 text-left">Change Password</span>
                  <span className="material-symbols-outlined text-slate-300 text-[20px]">chevron_right</span>
                </button>
              )}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#003366] text-[22px]">smartphone</span>
                  <span className="text-sm font-medium text-slate-800">Software Version</span>
                </div>
                <span className="text-sm font-bold text-slate-400">{APP_VERSION}</span>
              </div>
              <button onClick={onLogout}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors">
                <span className="material-symbols-outlined text-red-500 text-[22px]">logout</span>
                <span className="flex-1 text-sm font-medium text-red-500 text-left">Sign Out</span>
              </button>
            </div>

            <p className="text-center text-slate-300 text-[10px] pb-2">© 2024 Mata Technologies Inc. · A.G.A.S</p>
          </div>
        </main>
      </div>

      {/* ── Mobile Layout ────────────────────────────────────────────────────── */}
      <div className="flex md:hidden flex-col flex-1">
        <main className="flex-1 pb-36 max-w-2xl mx-auto w-full">

          {/* Profile card */}
          <div className="bg-white mx-4 mt-5 mb-1 rounded-2xl px-5 py-4 shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-4">
              {logo ? (
                <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2"
                  style={{ background: logo.bg, borderColor: logo.fg + "40" }}>
                  <span className="font-headline font-black text-xl" style={{ color: logo.fg }}>{logo.abbr}</span>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full border-2 border-[#2e7d32] flex items-center justify-center shrink-0 bg-white shadow-sm">
                  <span className="material-symbols-outlined text-[#2e7d32] text-[28px]">manage_accounts</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-headline font-black text-[#003366] text-lg leading-tight truncate">{name}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{brand ?? "View and edit profile"}</p>
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
                  <button key={item.label}
                    className={`w-full flex items-center gap-4 px-5 py-4 transition-colors active:bg-slate-50 ${
                      i < items.length - 1 ? "border-b border-slate-100" : ""
                    }`}>
                    <span className="material-symbols-outlined text-[#003366] text-[22px]">{item.icon}</span>
                    <span className="flex-1 text-sm font-medium text-slate-800 text-left">{item.label}</span>
                    <span className="material-symbols-outlined text-slate-300 text-[20px]">chevron_right</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Version + Sign out */}
          <div className="mt-5 mx-4 bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
            {onChangePassword && (
              <button onClick={onChangePassword}
                className="w-full flex items-center gap-4 px-5 py-4 border-b border-slate-100 active:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined text-[#003366] text-[22px]">lock_reset</span>
                <span className="flex-1 text-sm font-medium text-slate-800 text-left">Change Password</span>
                <span className="material-symbols-outlined text-slate-300 text-[20px]">chevron_right</span>
              </button>
            )}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[#003366] text-[22px]">smartphone</span>
                <span className="text-sm font-medium text-slate-800">Software Version</span>
              </div>
              <span className="text-sm font-bold text-slate-400">{APP_VERSION}</span>
            </div>
            <button onClick={onLogout}
              className="w-full flex items-center gap-4 px-5 py-4 active:bg-red-50 transition-colors">
              <span className="material-symbols-outlined text-red-500 text-[22px]">logout</span>
              <span className="flex-1 text-sm font-medium text-red-500 text-left">Sign Out</span>
            </button>
          </div>

          <p className="text-center text-slate-300 text-[10px] pt-5 pb-2">
            © 2024 Mata Technologies Inc. · A.G.A.S
          </p>
        </main>

        <BottomNav active={activeTab} onChange={onTabChange} tabs={OFFICER_TABS} />
      </div>
    </div>
  );
}
