import { useStationSidebarCollapsed } from "@/shared/hooks/useStationSidebarCollapsed";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "history", label: "Transaction", icon: "receipt_long" },
  { id: "settings", label: "Account", icon: "manage_accounts" },
] as const;

type StationDesktopSidebarProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
};

export default function StationDesktopSidebar({
  activeTab,
  onTabChange,
  onLogout,
}: StationDesktopSidebarProps) {
  const [collapsed, toggleCollapsed] = useStationSidebarCollapsed();

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 sticky top-0 h-screen transition-[width] duration-300 ease-out ${
        collapsed ? "w-[68px]" : "w-52 lg:w-60"
      }`}
      style={{ background: "linear-gradient(180deg, #0a1628 0%, #0d2a5e 100%)" }}
    >
      <div
        className={`flex items-center gap-3 border-b border-white/10 py-5 shrink-0 ${
          collapsed ? "justify-center px-2" : "px-5"
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
          <span
            className="material-symbols-outlined text-[#0a1628] text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            local_gas_station
          </span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-headline font-black text-white text-sm leading-none">A.G.A.S</p>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Station Portal</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={collapsed ? item.label : undefined}
              onClick={() => onTabChange(item.id)}
              className={`relative w-full flex items-center rounded-xl text-sm font-medium transition-all text-left ${
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
              } ${
                isActive ? "bg-white/15 text-white" : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px] shrink-0"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />}
                </>
              )}
              {collapsed && isActive && (
                <span className="absolute top-2 right-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-2 py-3 space-y-1 shrink-0">
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "Expand menu" : "Collapse menu"}
          className={`w-full flex items-center gap-3 rounded-xl py-2.5 text-sm font-semibold transition-all text-sky-200/90 hover:bg-white/10 hover:text-white ${
            collapsed ? "justify-center px-2" : "px-3"
          }`}
        >
          <span className="material-symbols-outlined text-[20px] shrink-0">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Sign Out" : undefined}
          className={`w-full flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all ${
            collapsed ? "justify-center px-2" : "px-3"
          }`}
        >
          <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
