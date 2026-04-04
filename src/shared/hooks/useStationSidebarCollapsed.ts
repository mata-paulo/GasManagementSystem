import { useCallback, useState } from "react";

const STORAGE_KEY = "agas-station-sidebar-collapsed";

export function useStationSidebarCollapsed(): readonly [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "true",
  );

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
      return next;
    });
  }, []);

  return [collapsed, toggle] as const;
}
