export const STATION_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "history", label: "Transaction", icon: "receipt_long" },
  { id: "settings", label: "Account", icon: "manage_accounts" },
] as const;

export type StationNavId = (typeof STATION_NAV_ITEMS)[number]["id"];

const STATION_NAV_PATHS: Record<StationNavId, string> = {
  dashboard: "/station/dashboard",
  history: "/station/history",
  settings: "/station/settings",
};

export function getStationPath(tab: StationNavId): string {
  return STATION_NAV_PATHS[tab];
}

export function getStationTabFromPath(pathname: string): StationNavId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  if (normalized === "/station" || normalized === "/station/dashboard") {
    return "dashboard";
  }

  if (normalized === "/station/history") {
    return "history";
  }

  if (normalized === "/station/settings") {
    return "settings";
  }

  return null;
}
