interface TabItem {
  id: string;
  icon: string;
  label: string;
}

const OFFICER_TABS: TabItem[] = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "history", icon: "receipt_long", label: "Transaction" },
  { id: "settings", icon: "account_circle", label: "Account" },
];

const USER_TABS: TabItem[] = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "user-history", icon: "receipt_long", label: "Scan History" },
  { id: "map", icon: "map", label: "Map" },
  { id: "settings", icon: "account_circle", label: "Account" },
];

export { USER_TABS };

interface BottomNavProps {
  active: string;
  onChange: (tab: string) => void;
  tabs?: TabItem[];
}

export default function BottomNav({ active, onChange, tabs = OFFICER_TABS }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-white/80 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,30,64,0.06)] rounded-t-3xl">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 flex-col items-center justify-center py-2 rounded-xl transition-all duration-200 ${
              isActive
                ? "bg-[#003366] text-white scale-105"
                : "text-slate-400 hover:text-[#705d00]"
            }`}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            <span className="font-body font-medium text-[11px] mt-0.5">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

