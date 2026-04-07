import {onRequest, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {CORS} from "../utils/validators";

function extractBearerToken(req: {headers: {authorization?: string}}): string {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new HttpsError("unauthenticated", "Missing authorization token.");
  }
  return header.slice("Bearer ".length).trim();
}

export const finalizeStationRegistration = onRequest(
  {region: "asia-southeast1", cors: CORS},
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const token = extractBearerToken(req);
      let decoded: admin.auth.DecodedIdToken;
      try {
        decoded = await admin.auth().verifyIdToken(token);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.warn("finalizeStationRegistration: token verification failed", {message: msg});
        throw new HttpsError("unauthenticated", "Invalid or expired authorization token.");
      }

      const registrationToken =
        req.body && typeof req.body === "object" && typeof (req.body as {token?: unknown}).token === "string"
          ? String((req.body as {token: string}).token).trim()
          : "";
      if (!registrationToken) {
        throw new HttpsError("invalid-argument", "registration token is required.");
      }

      const db = admin.firestore();
      const authUid = decoded.uid;

      const pendingSnap = await db
        .collection("accounts")
        .where("registrationToken.token", "==", registrationToken)
        .limit(1)
        .get();

      const pendingDoc = pendingSnap.docs[0];
      if (!pendingDoc) {
        throw new HttpsError("not-found", "Registration token not found.");
      }

      const pendingData = pendingDoc.data() as Record<string, unknown>;
      const pendingRt = (pendingData.registrationToken ?? null) as null | {
        createdAt?: unknown;
        expiresAt?: unknown;
        used?: unknown;
        createdByUid?: unknown;
      };

      if (pendingRt?.used === true) {
        throw new HttpsError("failed-precondition", "Registration token has already been used.");
      }

      const expiresAtRaw = pendingRt?.expiresAt;
      const expiresAt =
        expiresAtRaw instanceof Timestamp
          ? expiresAtRaw.toDate()
          : typeof expiresAtRaw === "string"
            ? new Date(expiresAtRaw)
            : null;
      if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
        throw new HttpsError("failed-precondition", "Registration token expiry is invalid.");
      }
      if (Date.now() > expiresAt.getTime()) {
        throw new HttpsError("failed-precondition", "Registration token has expired.");
      }

      const accountRef = db.collection("accounts").doc(authUid);
      const accountSnap = await accountRef.get();
      if (!accountSnap.exists) {
        throw new HttpsError("failed-precondition", "Account record not found. Complete registration first.");
      }

      await db.runTransaction(async (tx) => {
        const freshPending = await tx.get(pendingDoc.ref);
        if (!freshPending.exists) {
          throw new HttpsError("not-found", "Registration token not found.");
        }
        const freshRt = (freshPending.data()?.registrationToken ?? null) as null | {used?: unknown};
        if (freshRt?.used === true) {
          throw new HttpsError("failed-precondition", "Registration token has already been used.");
        }

        tx.set(
          accountRef,
          {
            registrationToken: {
              token: registrationToken,
              createdAt: pendingRt?.createdAt ?? FieldValue.serverTimestamp(),
              expiresAt: pendingRt?.expiresAt ?? Timestamp.fromDate(expiresAt),
              createdByUid: typeof pendingRt?.createdByUid === "string" ? pendingRt.createdByUid : null,
              used: true,
              usedAt: FieldValue.serverTimestamp(),
              claimedFromUid: pendingDoc.id,
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          {merge: true},
        );

        tx.set(
          pendingDoc.ref,
          {
            registrationToken: {
              ...(typeof pendingRt === "object" && pendingRt ? pendingRt : {}),
              used: true,
              usedAt: FieldValue.serverTimestamp(),
              claimedByUid: authUid,
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          {merge: true},
        );
      });

      res.status(200).json({success: true});
    } catch (err: unknown) {
      if (err instanceof HttpsError) {
        const statusMap: Record<string, number> = {
          "invalid-argument": 400,
          "failed-precondition": 400,
          "unauthenticated": 401,
          "permission-denied": 403,
          "not-found": 404,
        };
        res.status(statusMap[err.code] ?? 500).json({error: {status: err.code, message: err.message}});
        return;
      }
      logger.error("finalizeStationRegistration: unhandled error", err);
      res.status(500).json({error: {status: "internal", message: "Failed to finalize registration."}});
    }
  },
);

