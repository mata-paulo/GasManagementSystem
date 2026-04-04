import {onRequest, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {FieldValue} from "firebase-admin/firestore";
import {randomBytes} from "node:crypto";
import type {Request, Response} from "express";
import nodemailer from "nodemailer";
import {
  assignStationUserSchema,
  CORS,
  type AssignStationUserInput,
} from "../utils/validators";

type BrandPrice = {
  label: string;
  price: number;
};

type StationDirectoryRecord = {
  sourceId?: number;
  name?: string;
  brand?: string;
  barangay?: string;
  brandPrices?: BrandPrice[];
  capacity?: number;
  status?: string;
};

type StationInviteStatus = "pending" | "accepted";

type InviteEmailStatus = "queued" | "sent" | "failed" | "not-applicable";

type PendingInviteResponse = {
  id: string;
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  stationDirectoryId: string;
  stationSourceId: number;
  stationName: string;
  brand: string;
  barangay: string;
  status: StationInviteStatus;
  deliveryMethod: string;
  emailStatus: InviteEmailStatus;
  invitedAt: string;
  inviteSentAt?: string;
  emailError?: string | null;
};

function sendHttpsError(res: Response, err: HttpsError): void {
  const statusMap: Record<string, number> = {
    "invalid-argument": 400,
    "failed-precondition": 400,
    "unauthenticated": 401,
    "permission-denied": 403,
    "not-found": 404,
    "already-exists": 409,
  };
  const status = statusMap[err.code] ?? 500;
  res.status(status).json({
    error: {
      status: err.code,
      message: err.message,
    },
  });
}

function extractBearerToken(req: Request): string {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new HttpsError("unauthenticated", "Missing admin authorization token.");
  }
  return header.slice("Bearer ".length).trim();
}

async function requireAdminUid(req: Request): Promise<string> {
  const token = extractBearerToken(req);
  const decoded = await admin.auth().verifyIdToken(token);
  const accountSnap = await admin.firestore().collection("accounts").doc(decoded.uid).get();
  const role = accountSnap.data()?.role;
  if (role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can assign station users.");
  }
  return decoded.uid;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * When the admin only provides an email, derive officer first/last for Auth + Firestore.
 * e.g. john.doe@mata.ph → John / Doe; single segment → Title / Officer
 */
function deriveStationOfficerNamesFromEmail(
  normalizedEmail: string,
  explicitFirst?: string,
  explicitLast?: string,
): {firstName: string; lastName: string} {
  const f = explicitFirst?.trim() ?? "";
  const l = explicitLast?.trim() ?? "";
  if (f && l) {
    return {firstName: f, lastName: l};
  }
  if (f) {
    return {firstName: f, lastName: "Officer"};
  }

  const local = normalizedEmail.split("@")[0] ?? "user";
  const segments = local.split(/[._-]+/).filter(Boolean);
  const cap = (s: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
  if (segments.length === 0) {
    return {firstName: "Station", lastName: "Officer"};
  }
  if (segments.length === 1) {
    return {firstName: cap(segments[0]), lastName: "Officer"};
  }
  return {
    firstName: cap(segments[0]),
    lastName: segments.slice(1).map(cap).join(" "),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildStationCode(sourceId: number | undefined): string {
  if (!Number.isFinite(sourceId)) return "STN-000";
  return `STN-${String(sourceId).padStart(3, "0")}`;
}

function asBrandPrices(value: unknown): BrandPrice[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const label = typeof (entry as {label?: unknown}).label === "string" ?
        (entry as {label: string}).label.trim() : "";
      const price = Number((entry as {price?: unknown}).price);
      return label && Number.isFinite(price) ? {label, price} : null;
    })
    .filter((entry): entry is BrandPrice => entry != null);
}

function splitCapacity(totalCapacity: number, labels: string[]): Record<string, number> {
  if (!Number.isFinite(totalCapacity) || totalCapacity <= 0 || labels.length === 0) {
    return {};
  }

  const base = Math.floor(totalCapacity / labels.length);
  let remainder = totalCapacity - base * labels.length;

  return Object.fromEntries(
    labels.map((label) => {
      const next = base + (remainder > 0 ? 1 : 0);
      remainder = Math.max(remainder - 1, 0);
      return [label, next];
    })
  );
}

async function findUserByEmail(normalizedEmail: string): Promise<admin.auth.UserRecord | null> {
  try {
    return await admin.auth().getUserByEmail(normalizedEmail);
  } catch (err: unknown) {
    const code = (err as {code?: string}).code;
    if (code === "auth/user-not-found") return null;
    throw err;
  }
}

async function createUserIfNeeded(
  normalizedEmail: string,
  password: string,
  displayName: string,
): Promise<{userRecord: admin.auth.UserRecord; created: boolean}> {
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    await admin.auth().updateUser(existing.uid, {displayName});
    return {userRecord: existing, created: false};
  }

  const userRecord = await admin.auth().createUser({
    email: normalizedEmail,
    password,
    displayName,
  });
  return {userRecord, created: true};
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is not configured.`);
  }
  return value.trim();
}

function getAppBaseUrl(): string {
  return process.env.APP_BASE_URL?.trim() || "https://agas-fuel-rationing-system.web.app";
}

function buildInviteTransport() {
  const host = getRequiredEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = getRequiredEnv("SMTP_USER");
  const pass = getRequiredEnv("SMTP_PASS");

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {user, pass},
  });
}

async function sendStationInviteEmail(args: {
  email: string;
  firstName: string;
  stationName: string;
  brand: string;
  barangay: string;
  acceptUrl: string;
}): Promise<void> {
  const transporter = buildInviteTransport();
  const fromEmail = getRequiredEnv("SMTP_FROM_EMAIL");
  const fromName = process.env.SMTP_FROM_NAME?.trim() || "AGAS";
  const safeFirstName = escapeHtml(args.firstName);
  const safeStationName = escapeHtml(args.stationName);
  const safeBrand = escapeHtml(args.brand);
  const safeBarangay = escapeHtml(args.barangay);
  const safeAcceptUrl = escapeHtml(args.acceptUrl);

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: args.email,
    subject: `AGAS Station Invite for ${args.stationName}`,
    text: [
      `Hello ${args.firstName},`,
      "",
      `You have been assigned to ${args.stationName} (${args.brand}, ${args.barangay}) in AGAS.`,
      "Use the secure link below to activate your station access and set your password:",
      safeAcceptUrl,
      "",
      "If you were not expecting this invite, you can ignore this message.",
    ].join("\n"),
    html: `
      <div style="margin:0;padding:32px 16px;background:#edf3f8;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:640px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#003366 0%,#0b4f8a 100%);border-radius:28px 28px 0 0;padding:28px 32px;">
            <div style="display:inline-block;background:rgba(255,255,255,0.14);color:#facc15;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;padding:8px 12px;border-radius:999px;">
              AGAS Station Access
            </div>
            <h1 style="margin:18px 0 8px;font-size:30px;line-height:1.15;color:#ffffff;font-weight:800;">
              You are invited to manage a station
            </h1>
            <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.84);">
              Your admin has assigned you to a station role in AGAS. Activate your access below to start managing transactions and station activity.
            </p>
          </div>

          <div style="background:#ffffff;border:1px solid #dbe7f2;border-top:0;border-radius:0 0 28px 28px;padding:32px;">
            <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">
              Hello <strong>${safeFirstName}</strong>,
            </p>

            <div style="background:#f8fbff;border:1px solid #d7e7f7;border-radius:22px;padding:20px 22px;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#5b7a99;">
                Assigned Station
              </p>
              <p style="margin:0 0 10px;font-size:22px;font-weight:800;color:#003366;">
                ${safeStationName}
              </p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">
                Brand: <strong>${safeBrand}</strong><br />
                Barangay: <strong>${safeBarangay}</strong>
              </p>
            </div>

            <p style="margin:0 0 22px;font-size:15px;line-height:1.8;color:#334155;">
              Click the button below to accept the invitation, create your password, and complete your station access setup.
            </p>

            <div style="margin-bottom:24px;">
              <a href="${safeAcceptUrl}"
                 style="display:inline-block;background:#003366;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:15px 24px;border-radius:14px;box-shadow:0 10px 24px rgba(0,51,102,0.18);">
                Accept Invite
              </a>
            </div>

            <div style="background:#fff7e6;border:1px solid #fde7a8;border-radius:18px;padding:16px 18px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;line-height:1.7;color:#7c5c00;">
                This invite link uses Firebase secure password setup. After setting your password, sign in with the same email address to access your assigned station.
              </p>
            </div>

            <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">
              Manual Link
            </p>
            <p style="margin:0;font-size:13px;line-height:1.8;word-break:break-all;color:#1565c0;">
              <a href="${safeAcceptUrl}" style="color:#1565c0;text-decoration:none;">${safeAcceptUrl}</a>
            </p>

            <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.7;color:#94a3b8;">
                If you were not expecting this invite, you can ignore this email.
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
  });
}

export const assignStationUser = onRequest(
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
      const adminUid = await requireAdminUid(req);

      if (req.body == null || typeof req.body !== "object") {
        throw new HttpsError("invalid-argument", "Missing request body.");
      }

      const parsed = assignStationUserSchema.safeParse(req.body);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw new HttpsError("invalid-argument", issue?.message ?? "Invalid request data.");
      }

      const data: AssignStationUserInput = parsed.data;
      const normalizedEmail = normalizeEmail(data.email);
      const {firstName, lastName} = deriveStationOfficerNamesFromEmail(
        normalizedEmail,
        data.firstName,
        data.lastName,
      );
      const displayName = `${firstName} ${lastName}`.trim();
      const db = admin.firestore();

      const stationSnap = await db.collection("stationDirectory").doc(data.stationDirectoryId).get();
      if (!stationSnap.exists) {
        throw new HttpsError("not-found", "Selected station was not found.");
      }

      const station = stationSnap.data() as StationDirectoryRecord;
      const brandPrices = asBrandPrices(station.brandPrices);
      const fuelLabels = brandPrices.map((entry) => entry.label);
      const totalCapacity = Number.isFinite(station.capacity) ? Number(station.capacity) : 0;
      const fuelCapacities = splitCapacity(totalCapacity, fuelLabels);
      const fuelInventory = Object.fromEntries(
        Object.entries(fuelCapacities).map(([label, value]) => [label, value])
      );
      const fuelPrices = Object.fromEntries(
        brandPrices.map((entry) => [entry.label, entry.price])
      );

      const generatedPassword = randomBytes(18).toString("base64url");
      const {userRecord, created} = await createUserIfNeeded(
        normalizedEmail,
        generatedPassword,
        displayName,
      );
      const accountRef = db.collection("accounts").doc(userRecord.uid);
      const inviteRef = db.collection("stationInvites").doc(userRecord.uid);
      const accountSnap = await accountRef.get();
      const existing = accountSnap.data() as Record<string, unknown> | undefined;

      if (existing?.role === "admin") {
        throw new HttpsError(
          "failed-precondition",
          "Admin accounts cannot be reassigned into station role.",
        );
      }

      const existingStationDirectoryId =
        typeof existing?.stationDirectoryId === "string" ? existing.stationDirectoryId : null;
      if (
        existingStationDirectoryId &&
        existingStationDirectoryId !== data.stationDirectoryId
      ) {
        throw new HttpsError(
          "failed-precondition",
          "This user is already assigned to another station.",
        );
      }

      const stationSourceId = Number.isFinite(station.sourceId) ? Number(station.sourceId) : 0;
      const stationName = typeof station.name === "string" ? station.name : "Station";
      const brand = typeof station.brand === "string" ? station.brand : "Other";
      const barangay = typeof station.barangay === "string" ? station.barangay : "Unknown";
      const inviteCreatedAtIso = new Date().toISOString();
      const stationCode =
        typeof existing?.stationCode === "string" && existing.stationCode.trim()
          ? existing.stationCode
          : buildStationCode(stationSourceId);
      const stationStatus =
        typeof existing?.status === "string" && existing.status.trim()
          ? existing.status
          : typeof station.status === "string" && station.status.toLowerCase() === "offline"
            ? "offline"
            : "online";
      const assignmentStatus =
        existing?.role === "station" &&
        existingStationDirectoryId === data.stationDirectoryId &&
        existing?.assignmentStatus === "active"
          ? "active"
          : "pending";
      const acceptUrl = await admin.auth().generatePasswordResetLink(normalizedEmail, {
        url: `${getAppBaseUrl()}/`,
      });
      let inviteEmailStatus: InviteEmailStatus =
        assignmentStatus === "pending" ? "queued" : "not-applicable";
      let inviteEmailError: string | null = null;
      let pendingInvite: PendingInviteResponse | null = null;

      const batch = db.batch();
      batch.set(accountRef, {
        email: normalizedEmail,
        firstName,
        lastName,
        officerFirstName: firstName,
        officerLastName: lastName,
        role: "station",
        stationDirectoryId: data.stationDirectoryId,
        stationSourceId,
        stationName,
        stationCode,
        brand,
        barangay,
        availableFuels: fuelLabels,
        fuelPrices,
        fuelCapacities:
          Object.keys((existing?.fuelCapacities as Record<string, unknown> | undefined) ?? {}).length > 0
            ? existing?.fuelCapacities
            : fuelCapacities,
        fuelInventory:
          Object.keys((existing?.fuelInventory as Record<string, unknown> | undefined) ?? {}).length > 0
            ? existing?.fuelInventory
            : fuelInventory,
        status: stationStatus,
        assignmentStatus,
        assignedByUid: adminUid,
        assignedAt: FieldValue.serverTimestamp(),
        inviteAcceptedAt: assignmentStatus === "active" ? existing?.inviteAcceptedAt ?? FieldValue.serverTimestamp() : null,
        updatedAt: FieldValue.serverTimestamp(),
        registeredAt: existing?.registeredAt ?? FieldValue.serverTimestamp(),
      }, {merge: true});

      if (assignmentStatus === "pending") {
        batch.set(inviteRef, {
          uid: userRecord.uid,
          email: normalizedEmail,
          firstName,
          lastName,
          stationDirectoryId: data.stationDirectoryId,
          stationSourceId,
          stationName,
          brand,
          barangay,
          status: "pending" as StationInviteStatus,
          acceptUrl,
          deliveryMethod: "smtp-html",
          emailStatus: "queued" as InviteEmailStatus,
          invitedByUid: adminUid,
          invitedAt: FieldValue.serverTimestamp(),
          inviteSentAt: null,
          acceptedAt: null,
          emailError: null,
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        pendingInvite = {
          id: userRecord.uid,
          uid: userRecord.uid,
          email: normalizedEmail,
          firstName,
          lastName,
          stationDirectoryId: data.stationDirectoryId,
          stationSourceId,
          stationName,
          brand,
          barangay,
          status: "pending",
          deliveryMethod: "smtp-html",
          emailStatus: "queued",
          invitedAt: inviteCreatedAtIso,
          emailError: null,
        };
      }

      await batch.commit();

      if (assignmentStatus === "pending") {
        try {
          await sendStationInviteEmail({
            email: normalizedEmail,
            firstName,
            stationName,
            brand,
            barangay,
            acceptUrl,
          });

          inviteEmailStatus = "sent";
          pendingInvite = pendingInvite ? {
            ...pendingInvite,
            emailStatus: "sent",
            inviteSentAt: new Date().toISOString(),
            emailError: null,
          } : pendingInvite;
          await inviteRef.set({
            emailStatus: "sent" as InviteEmailStatus,
            inviteSentAt: FieldValue.serverTimestamp(),
            emailError: null,
            updatedAt: FieldValue.serverTimestamp(),
          }, {merge: true});
        } catch (emailErr: unknown) {
          inviteEmailStatus = "failed";
          inviteEmailError = emailErr instanceof Error ? emailErr.message : "Failed to send invite email.";
          pendingInvite = pendingInvite ? {
            ...pendingInvite,
            emailStatus: "failed",
            emailError: inviteEmailError,
          } : pendingInvite;
          logger.error("assignStationUser: invite email failed", {
            email: normalizedEmail,
            uid: userRecord.uid,
            stationDirectoryId: data.stationDirectoryId,
            message: inviteEmailError,
          });
          await inviteRef.set({
            emailStatus: "failed" as InviteEmailStatus,
            inviteSentAt: null,
            emailError: inviteEmailError,
            updatedAt: FieldValue.serverTimestamp(),
          }, {merge: true});
        }
      }

      const assignedCountSnapshot = await db.collection("accounts")
        .where("role", "==", "station")
        .where("stationDirectoryId", "==", data.stationDirectoryId)
        .get();

      res.status(200).json({
        uid: userRecord.uid,
        email: normalizedEmail,
        firstName,
        lastName,
        stationDirectoryId: data.stationDirectoryId,
        stationSourceId,
        stationName,
        assignedUserCount: assignedCountSnapshot.size,
        assignmentStatus,
        inviteStatus: assignmentStatus,
        inviteEmailStatus,
        inviteEmailError,
        inviteDeliveryMethod: assignmentStatus === "pending" ? "smtp-html" : "none",
        isNewUser: created,
        pendingInvite,
      });
    } catch (err: unknown) {
      if (err instanceof HttpsError) {
        sendHttpsError(res, err);
        return;
      }

      logger.error("assignStationUser: unhandled error", {
        message: err instanceof Error ? err.message : String(err),
      });
      sendHttpsError(
        res,
        new HttpsError("internal", "Failed to assign station user."),
      );
    }
  }
);
