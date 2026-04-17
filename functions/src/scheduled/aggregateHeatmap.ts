import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions/logger";
import {performHeatmapAggregation} from "./heatmapAggregationLogic";
import {getWeekKey} from "../utils/residentFuelCycle";

export {HeatmapStationEntry, WeeklyHeatmapDoc} from "./heatmapAggregationLogic";

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
    schedule: "0 * * * *", // Every hour at :00 (10:00, 11:00, 12:00, etc.)
    timeZone: "Asia/Manila", // Match server timezone
    region: "asia-southeast1",
    timeoutSeconds: 120,
  },
  async () => {
    const weekKey = getWeekKey(new Date());
    logger.info("aggregateWeeklyHeatmap: starting aggregation", {weekKey});

    try {
      const result = await performHeatmapAggregation();
      logger.info("aggregateWeeklyHeatmap: done", {
        weekKey,
        stationCount: result.stations.length,
      });
    } catch (err) {
      logger.error("aggregateWeeklyHeatmap: failed", {weekKey, error: String(err)});
      throw err;
    }
  },
);
