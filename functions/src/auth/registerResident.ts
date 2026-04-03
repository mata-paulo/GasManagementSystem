import {onRequest, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {FieldValue} from "firebase-admin/firestore";
import type {Request, Response} from "express";
import {
  registerResidentSchema,
  type RegisterResidentInput,
} from "../utils/validators";

async function assertEmailAndPlateAvailable(
  normalizedEmail: string,
  normalizedPlate: string
): Promise<void> {
  const db = admin.firestore();
  const accounts = db.collection("accounts");

  const [byEmail, byPlate] = await Promise.all([
    accounts.where("email", "==", normalizedEmail).limit(1).get(),
    accounts.where("plate", "==", normalizedPlate).limit(1).get(),
  ]);

  if (!byEmail.empty) {
    throw new HttpsError(
      "already-exists",
      "An account with this email is already registered."
    );
  }
  if (!byPlate.empty) {
    throw new HttpsError(
      "already-exists",
      "This plate number is already registered."
    );
  }
}

function sendHttpsError(res: Response, err: HttpsError): void {
  // Mirror callable error shape loosely (enough for frontend messages).
  const statusMap: Record<string, number> = {
    "invalid-argument": 400,
    "failed-precondition": 400,
    "out-of-range": 400,
    "unauthenticated": 401,
    "permission-denied": 403,
    "not-found": 404,
    "already-exists": 409,
    "aborted": 409,
    "resource-exhausted": 429,
    "cancelled": 499,
    "unavailable": 503,
  };
  const status = statusMap[err.code] ?? 500;
  res.status(status).json({
    error: {
      status: err.code,
      message: err.message,
      // `details` is intentionally omitted to avoid leaking internals.
    },
  });
}

export const registerResident = onRequest(
  {
    region: "asia-southeast1",
    cors: [
      "https://agas-fuel-rationing-system.web.app",
      "http://localhost:5173",
      "http://127.0.0.1:5173", 
      "https://agas.ph",
    ],
  },
  async (req: Request, res: Response) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      if (req.body == null || typeof req.body !== "object") {
        throw new HttpsError("invalid-argument", "Missing request body.");
      }

      const parsed = registerResidentSchema.safeParse(req.body);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const msg = issue?.message ?? "Invalid request data.";
        throw new HttpsError("invalid-argument", msg);
      }
      const data: RegisterResidentInput = parsed.data;

      const normalizedEmail = data.email.toLowerCase();
      const normalizedPlate = data.plate.trim().toUpperCase();

      await assertEmailAndPlateAvailable(normalizedEmail, normalizedPlate);

      let uid: string;
      try {
        const userRecord = await admin.auth().createUser({
          email: normalizedEmail,
          password: data.password,
          displayName: `${data.firstName} ${data.lastName}`,
        });
        uid = userRecord.uid;
      } catch (err: unknown) {
        const firebaseError = err as {code?: string; message?: string};
        if (firebaseError.code === "auth/email-already-exists") {
          throw new HttpsError(
            "already-exists",
            "An account with this email already exists."
          );
        }
        if (firebaseError.code === "auth/invalid-email") {
          throw new HttpsError("invalid-argument", "Invalid email address.");
        }
        if (firebaseError.code === "auth/weak-password") {
          throw new HttpsError("invalid-argument", "Password is too weak.");
        }
        logger.error("registerResident: createUser failed", {
          code: firebaseError.code,
          message:
            firebaseError.message ??
            (err instanceof Error ? err.message : String(err)),
        });
        throw new HttpsError(
          "internal",
          "Failed to create account. Please try again."
        );
      }

      try {
        await admin.firestore().collection("accounts").doc(uid).set({
          vehicleType: data.vehicleType,
          plate: normalizedPlate,
          gasType: data.gasType,
          firstName: data.firstName,
          lastName: data.lastName,
          barangay: data.barangay,
          email: normalizedEmail,
          role: "resident",
          registeredAt: FieldValue.serverTimestamp(),
        });
      } catch (err: unknown) {
        const fsErr = err as {code?: string | number; message?: string};
        const host = process.env.FIRESTORE_EMULATOR_HOST;
        logger.error(
          "registerResident: Firestore set failed — " +
            (fsErr.message ??
              (err instanceof Error ? err.message : String(err))),
          {
            errorCode: fsErr.code,
            firestoreEmulatorHost: host ?? "(unset — using production Firestore)",
          }
        );
        await admin.auth().deleteUser(uid).catch(() => undefined);
        throw new HttpsError(
          "internal",
          "Failed to save registration. Please try again."
        );
      }

      res.status(200).json({uid});
    } catch (err: unknown) {
      if (err instanceof HttpsError) {
        sendHttpsError(res, err);
        return;
      }
      logger.error("registerResident: unhandled error", {
        message: err instanceof Error ? err.message : String(err),
      });
      sendHttpsError(res, new HttpsError("internal", "Registration failed."));
    }
  }
);
