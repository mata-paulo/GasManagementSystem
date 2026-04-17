import {onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {performHeatmapAggregation} from "./heatmapAggregationLogic";

// CONFIGURE: Min seconds between manual heatmap triggers (prevents Firestore read spam)
const RATE_LIMIT_SECONDS = 300; // 5 minutes

/**
 * Callable Cloud Function — allows admin to manually trigger heatmap aggregation.
 * Rate-limited to once per minute to avoid excessive Firestore reads.
 */
export const triggerHeatmapAggregation = onCall(
  {
    region: "asia-southeast1",
    timeoutSeconds: 60,
  },
  async (request) => {
    // Verify admin role
    const uid = request.auth?.uid;
    if (!uid) {
      throw new Error("Unauthenticated");
    }

    const db = admin.firestore();
    const accountSnap = await db.collection("accounts").doc(uid).get();
    const accountData = accountSnap.data();

    if (accountData?.role !== "admin") {
      throw new Error("Unauthorized: admin role required");
    }

    // Check rate limit
    const rateLimitDoc = await db.collection("system").doc("heatmapTriggerRateLimit").get();
    const lastTriggerTime = rateLimitDoc.data()?.lastTrigger ?? 0;
    const now = Date.now();
    const secondsSinceLastTrigger = (now - lastTriggerTime) / 1000;

    if (secondsSinceLastTrigger < RATE_LIMIT_SECONDS) {
      const secondsRemaining = Math.ceil(RATE_LIMIT_SECONDS - secondsSinceLastTrigger);
      throw new Error(`Rate limited. Try again in ${secondsRemaining}s`);
    }

    logger.info("triggerHeatmapAggregation: starting manual aggregation", {uid});

    try {
      const result = await performHeatmapAggregation();

      // Update rate limit timestamp
      await db.collection("system").doc("heatmapTriggerRateLimit").set({
        lastTrigger: now,
        triggeredBy: uid,
      });

      logger.info("triggerHeatmapAggregation: done", {
        stationCount: result.stations.length,
        uid,
      });

      return {
        success: true,
        stationCount: result.stations.length,
        computedAt: result.computedAt,
      };
    } catch (err) {
      logger.error("triggerHeatmapAggregation: failed", {error: String(err)});
      throw err;
    }
  },
);
