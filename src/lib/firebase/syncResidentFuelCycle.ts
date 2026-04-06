import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable, type HttpsCallableResult } from "firebase/functions";
import { auth, functions } from "@/lib/firebase/client";

/** Session restore can lag behind `localStorage`; wait for first auth tick before callable. */
function waitForAuthTick(): Promise<void> {
  if (auth.currentUser) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, () => {
      unsub();
      resolve();
    });
  });
}

export type SyncResidentFuelCycleResult = {
  updated: boolean;
  fuelUsed: number;
  fuelWeekKey: string;
};

function parseSyncPayload(raw: unknown): SyncResidentFuelCycleResult | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.updated !== "boolean") return null;
  const fuelUsed = Number(o.fuelUsed);
  const fuelWeekKey = typeof o.fuelWeekKey === "string" ? o.fuelWeekKey : "";
  if (!Number.isFinite(fuelUsed) || !fuelWeekKey) return null;
  return { updated: o.updated, fuelUsed, fuelWeekKey };
}

/**
 * Callable `syncResidentFuelCycle` — aligns Firestore `fuelWeekKey` / `fuelUsed` when the
 * resident enters a new 7-day (or calendar-week) cycle. Safe to call on every login / refresh.
 */
export async function syncResidentFuelCycleCallable(): Promise<SyncResidentFuelCycleResult | null> {
  await waitForAuthTick();
  if (!auth.currentUser) return null;
  try {
    const fn = httpsCallable<void, SyncResidentFuelCycleResult>(functions, "syncResidentFuelCycle");
    const res: HttpsCallableResult<unknown> = await fn();
    return parseSyncPayload(res.data);
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("[AGAS] syncResidentFuelCycle failed", e);
    }
    return null;
  }
}
