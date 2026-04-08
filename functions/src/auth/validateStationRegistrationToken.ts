import {onRequest, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";
import {CORS} from "../utils/validators";

type ValidateResponse =
  | {valid: true; expiresAt: string}
  | {valid: false; reason: string};

export const validateStationRegistrationToken = onRequest(
  {region: "asia-southeast1", cors: CORS, invoker: "private"},
  async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
      if (!token) {
        throw new HttpsError("invalid-argument", "token is required.");
      }

      const db = admin.firestore();
      const snap = await db
        .collection("accounts")
        .where("registrationToken.token", "==", token)
        .limit(1)
        .get();

      const doc = snap.docs[0];
      if (!doc) {
        const payload: ValidateResponse = {valid: false, reason: "Token not found."};
        res.status(200).json(payload);
        return;
      }

      const data = doc.data() as Record<string, unknown>;
      const rt = (data.registrationToken ?? null) as null | {
        expiresAt?: unknown;
        used?: unknown;
      };

      const used = rt?.used === true;
      if (used) {
        const payload: ValidateResponse = {valid: false, reason: "Token has already been used."};
        res.status(200).json(payload);
        return;
      }

      const expiresAtRaw = rt?.expiresAt;
      const expiresAt =
        expiresAtRaw instanceof Timestamp
          ? expiresAtRaw.toDate()
          : typeof expiresAtRaw === "string"
            ? new Date(expiresAtRaw)
            : null;

      if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
        const payload: ValidateResponse = {valid: false, reason: "Token expiry is invalid."};
        res.status(200).json(payload);
        return;
      }

      if (Date.now() > expiresAt.getTime()) {
        const payload: ValidateResponse = {valid: false, reason: "Token has expired."};
        res.status(200).json(payload);
        return;
      }

      const payload: ValidateResponse = {valid: true, expiresAt: expiresAt.toISOString()};
      res.status(200).json(payload);
    } catch (err: unknown) {
      if (err instanceof HttpsError) {
        res.status(err.code === "invalid-argument" ? 400 : 500).json({
          error: {status: err.code, message: err.message},
        });
        return;
      }
      logger.error("validateStationRegistrationToken: unhandled error", err);
      res.status(500).json({error: {status: "internal", message: "Failed to validate token."}});
    }
  },
);

