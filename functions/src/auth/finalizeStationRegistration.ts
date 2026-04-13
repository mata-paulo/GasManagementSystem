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
  {region: "asia-southeast1", cors: CORS, invoker: "private"},
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

      // IMPORTANT:
      // Only finalize against the *pending token doc* (registrationToken.used === false).
      // This avoids accidentally matching the newly-created station account doc if it still
      // carries a legacy registrationToken field from older deployments.
      const pendingSnap = await db
        .collection("accounts")
        .where("registrationToken.token", "==", registrationToken)
        .where("registrationToken.used", "==", false)
        .limit(1)
        .get();

      const pendingDoc = pendingSnap.docs[0];
      if (!pendingDoc) {
        // If a doc exists with this token but it's used, surface the correct error.
        const anySnap = await db
          .collection("accounts")
          .where("registrationToken.token", "==", registrationToken)
          .limit(1)
          .get();
        const anyDoc = anySnap.docs[0];
        if (anyDoc) {
          const anyData = anyDoc.data() as Record<string, unknown>;
          const anyRt = (anyData.registrationToken ?? null) as null | {used?: unknown};
          if (anyRt?.used === true) {
            throw new HttpsError("failed-precondition", "Registration token has already been used.");
          }
        }
        throw new HttpsError("not-found", "Registration token not found.");
      }

      const pendingData = pendingDoc.data() as Record<string, unknown>;
      const pendingRt = (pendingData.registrationToken ?? null) as null | {
        createdAt?: unknown;
        expiresAt?: unknown;
        used?: unknown;
        createdByUid?: unknown;
      };

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

        // Finalize registration for the authenticated station user.
        // IMPORTANT: do NOT persist the invite token on the station account (keeps the doc clean,
        // and prevents "Token Already Used" from reappearing on refresh). The token lives only
        // in the temporary pending doc, which we delete below.
        tx.set(
          accountRef,
          {
            assignmentStatus: "active",
            inviteAcceptedAt: FieldValue.serverTimestamp(),
            // Ensure any stray registrationToken field is removed.
            registrationToken: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          {merge: true},
        );

        // Clean up the temporary "pending" account document used to store the invite token.
        tx.delete(pendingDoc.ref);
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

