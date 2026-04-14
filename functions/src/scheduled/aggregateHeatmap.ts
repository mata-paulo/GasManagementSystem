import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {getWeekKey} from "../utils/residentFuelCycle";

export interface HeatmapStationEntry {
  stationUid: string;
  stationId: string;
  stationName: string;
  stationBrand: string;
  txCount: number;
  liters: number;
}

export interface WeeklyHeatmapDoc {
  weekKey: string;
  computedAt: string;
  stations: HeatmapStationEntry[];
}

/**
 * Scheduled Cloud Function — runs every hour.
 * Aggregates current-week transaction counts and liters per station,
 * then writes the result to `weeklyHeatmap/{weekKey}`.
 *
 * The dashboard reads this single document instead of scanning all
 * transactions, reducing Firestore reads from ~hundreds to 1 per poll.
 */
export const aggregateWeeklyHeatmap = onSchedule(
  {
    schedule: "every 1 hours",
    region: "asia-southeast1",
    timeoutSeconds: 120,
  },
  async () => {
    const db = admin.firestore();
    const weekKey = getWeekKey(new Date());

    logger.info("aggregateWeeklyHeatmap: starting aggregation", {weekKey});

    // Query only current-week transactions (server-side filter — cheap)
    const txSnap = await db
      .collection("transactions")
      .where("weekKey", "==", weekKey)
      .get();

    // Aggregate per stationUid
    const map = new Map<
      string,
      {stationId: string; stationName: string; stationBrand: string; txCount: number; liters: number}
    >();

    for (const doc of txSnap.docs) {
      const d = doc.data();
      const uid: string = d.stationUid ?? "";
      if (!uid) continue;

      const existing = map.get(uid);
      if (existing) {
        existing.txCount += 1;
        existing.liters += typeof d.liters === "number" ? d.liters : 0;
      } else {
        map.set(uid, {
          stationId: d.stationId ?? "",
          stationName: d.stationName ?? "",
          stationBrand: d.stationBrand ?? "",
          txCount: 1,
          liters: typeof d.liters === "number" ? d.liters : 0,
        });
      }
    }

    const stations: HeatmapStationEntry[] = Array.from(map.entries()).map(
      ([stationUid, v]) => ({
        stationUid,
        stationId: v.stationId,
        stationName: v.stationName,
        stationBrand: v.stationBrand,
        txCount: v.txCount,
        liters: Math.round(v.liters * 10) / 10,
      }),
    );

    const payload: WeeklyHeatmapDoc = {
      weekKey,
      computedAt: new Date().toISOString(),
      stations,
    };

    await db.collection("weeklyHeatmap").doc(weekKey).set(payload);

    logger.info("aggregateWeeklyHeatmap: done", {
      weekKey,
      stationCount: stations.length,
      totalTx: txSnap.size,
    });
  },
);
