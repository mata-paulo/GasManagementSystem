import {onRequest, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {FieldValue} from "firebase-admin/firestore";
import type {Request, Response} from "express";
import {
  CORS,
  formatPlateForStorage,
  normalizePlate,
  registerResidentSchema,
  type RegisterResidentInput,
} from "../utils/validators";

function getResidentRegistrationLimit(): number | null {
  const raw =
    process.env.RESIDENT_REGISTRATION_LIMIT ??
    process.env.VITE_RESIDENT_REGISTRATION_LIMIT ??
    process.env.VITE_PUBLIC_RESIDENT_REGISTRATION_LIMIT;

  if (!raw || !raw.trim()) return null;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.floor(parsed);
}

async function assertResidentRegistrationLimitAvailable(): Promise<void> {
  const limit = getResidentRegistrationLimit();
  if (limit == null) return;

  const snapshot = await admin.firestore()
    .collection("accounts")
    .where("role", "==", "resident")
    .count()
    .get();

  const currentResidents = snapshot.data().count;
  if (currentResidents >= limit) {
    throw new HttpsError(
      "resource-exhausted",
      "Resident registration limit has been reached."
    );
  }
}

async function assertEmailAndPlateAvailable(
  normalizedEmail: string,
  platesToCheck: string[]
): Promise<void> {
  const db = admin.firestore();
  const accounts = db.collection("accounts");

  const uniquePlates = [...new Set(platesToCheck.filter(Boolean))];
  // Normalize each plate for comparison (strips spaces, hyphens, etc.)
  const uniqueNormalized = [...new Set(uniquePlates.map(normalizePlate))];

  // For each normalized plate value, query:
  //   1. plateNormalized field (new accounts)
  //   2. vehicle2PlateNormalized field (new accounts, second vehicle)
  //   3. plate field exact match with normalized value (legacy accounts stored without spaces)
  //   4. vehicle2Plate field exact match with normalized value (legacy)
  const [byEmail, ...snapshots] = await Promise.all([
    accounts.where("email", "==", normalizedEmail).limit(1).get(),
    ...uniqueNormalized.flatMap((np) => [
      accounts.where("plateNormalized", "==", np).limit(1).get(),
      accounts.where("vehicle2PlateNormalized", "==", np).limit(1).get(),
      accounts.where("plate", "==", np).limit(1).get(),
      accounts.where("vehicle2Plate", "==", np).limit(1).get(),
    ]),
  ]);

  if (!byEmail.empty) {
    throw new HttpsError(
      "already-exists",
      "An account with this email is already registered."
    );
  }

  for (let i = 0; i < uniqueNormalized.length; i++) {
    const group = snapshots.slice(i * 4, i * 4 + 4);
    if (group.some((snap) => !snap.empty)) {
      throw new HttpsError(
        "already-exists",
        `Plate number ${uniquePlates[i]} is already registered to another account.`
      );
    }
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
    cors: CORS,
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
      const normalizedPlate = formatPlateForStorage(data.plate);

      // Collect all plates being registered (primary + vehicles array), formatted for storage
      const allPlates = data.vehicles && data.vehicles.length > 0
        ? [...new Set(data.vehicles.map((v) => formatPlateForStorage(v.plate)))]
        : [normalizedPlate];

      await assertResidentRegistrationLimitAvailable();
      await assertEmailAndPlateAvailable(normalizedEmail, allPlates);

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
        const docData: Record<string, unknown> = {
          vehicleType: data.vehicleType,
          plate: normalizedPlate,
          plateNormalized: normalizePlate(normalizedPlate),
          gasType: data.gasType,
          firstName: data.firstName,
          lastName: data.lastName,
          barangay: data.barangay,
          email: normalizedEmail,
          role: "resident",
          registeredAt: FieldValue.serverTimestamp(),
        };
        // Build vehicles array: prefer sent array, fallback to primary fields
        const vehiclesArray = (data.vehicles && data.vehicles.length > 0)
          ? data.vehicles.map((v) => ({ ...v, plate: formatPlateForStorage(v.plate) }))
          : [{ type: data.vehicleType, plate: normalizedPlate, gasType: data.gasType }];
        docData.vehicles = vehiclesArray;
        // Keep legacy individual fields for backward compatibility
        if (vehiclesArray.length > 1) {
          docData.vehicle2Type = vehiclesArray[1].type;
          docData.vehicle2Plate = vehiclesArray[1].plate;
          docData.vehicle2PlateNormalized = normalizePlate(vehiclesArray[1].plate);
          docData.vehicle2GasType = vehiclesArray[1].gasType;
        }
        await admin.firestore().collection("accounts").doc(uid).set(docData);
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
