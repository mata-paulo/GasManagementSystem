import {onCall, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {
  getResidentFuelCycleKey,
  getResidentTransactionCycleKey,
  parseTransactionDoc,
  registeredAtToDate,
  roundLiters,
} from "../utils/residentFuelCycle";

type SyncResult = {
  updated: boolean;
  fuelUsed: number;
  fuelWeekKey: string;
};

/**
 * Aligns `accounts/{uid}` fuelWeekKey + fuelUsed with the current resident cycle.
 * Residents cannot write these fields from the client (Firestore rules); this uses Admin.
 * Idempotent when the doc is already on the current cycle key.
 */
export const syncResidentFuelCycle = onCall({region: "asia-southeast1", invoker: "private"}, async (request): Promise<SyncResult> => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const db = admin.firestore();
  const ref = db.collection("accounts").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Account not found.");
  }

  const data = snap.data() as Record<string, unknown>;
  if (data.role !== "resident") {
    throw new HttpsError("permission-denied", "Only resident accounts can sync fuel cycle.");
  }

  const now = new Date();
  const registeredAt = registeredAtToDate(data);
  const currentKey = getResidentFuelCycleKey(uid, registeredAt, now);
  const storedKeyRaw = typeof data.fuelWeekKey === "string" ? data.fuelWeekKey.trim() : "";
  const storedFuelUsed = roundLiters(Number(data.fuelUsed) || 0);

  if (storedKeyRaw === currentKey) {
    return {
      updated: false,
      fuelUsed: storedFuelUsed,
      fuelWeekKey: currentKey,
    };
  }

  const txSnap = await db
    .collection("transactions")
    .where("residentUid", "==", uid)
    .limit(500)
    .get();

  let sumCurrentCycle = 0;
  for (const doc of txSnap.docs) {
    const tx = parseTransactionDoc(doc.data());
    const txKey = getResidentTransactionCycleKey(
      uid,
      registeredAt,
      tx.occurredAt,
      tx.createdAt,
    );
    if (txKey === currentKey) {
      sumCurrentCycle += tx.liters;
    }
  }
  sumCurrentCycle = roundLiters(sumCurrentCycle);

  await ref.update({
    fuelWeekKey: currentKey,
    fuelUsed: sumCurrentCycle,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info("syncResidentFuelCycle: aligned resident week", {
    uid,
    previousWeekKey: storedKeyRaw || null,
    currentKey,
    sumCurrentCycle,
  });

  return {
    updated: true,
    fuelUsed: sumCurrentCycle,
    fuelWeekKey: currentKey,
  };
});
