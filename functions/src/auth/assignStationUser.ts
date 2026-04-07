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
  acceptUrl: string;
  deliveryMethod: string;
  emailStatus: InviteEmailStatus;
  invitedAt: string;
  inviteSentAt?: string;
  expiresAt?: string;
  emailError?: string | null;
};

// Invite expiry window. Change this to adjust station invite validity.
const STATION_INVITE_TTL_DAYS = 30;

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

// Generic station invites do not use stationDirectory fuel templates.

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
      const db = admin.firestore();

      // New flow (generic station invites):
      // - Admin enters station manager email
      // - We create a station invite record + email a registration link
      // - Station manager completes StationRegister themselves (creates Auth user + Firestore account)
      const inviteId = randomBytes(16).toString("hex");
      const inviteRef = db.collection("stationInvites").doc(inviteId);
      const stationDirectoryId = "generic";
      const stationSourceId = 0;
      const stationName = "Station Registration";
      const brand = "";
      const barangay = "";
      const inviteCreatedAtIso = new Date().toISOString();
      const baseUrl = getAppBaseUrl().replace(/\/$/, "");
      const inviteContinue = new URLSearchParams({
        register: "station",
        stationInvite: "1",
        inviteEmail: normalizedEmail,
        inviteId,
      });
      const acceptUrl = `${baseUrl}/?${inviteContinue.toString()}`;
      const expiresAtDate = new Date(Date.now() + STATION_INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
      let inviteEmailStatus: InviteEmailStatus = "queued";
      let inviteEmailError: string | null = null;
      let pendingInvite: PendingInviteResponse | null = null;

      await inviteRef.set({
        uid: inviteId,
        email: normalizedEmail,
        firstName,
        lastName,
        stationDirectoryId,
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
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAtDate),
        acceptedAt: null,
        emailError: null,
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});

      pendingInvite = {
        id: inviteId,
        uid: inviteId,
        email: normalizedEmail,
        firstName,
        lastName,
        stationDirectoryId,
        stationSourceId,
        stationName,
        brand,
        barangay,
        status: "pending",
        acceptUrl,
        deliveryMethod: "smtp-html",
        emailStatus: "queued",
        invitedAt: inviteCreatedAtIso,
        expiresAt: expiresAtDate.toISOString(),
        emailError: null,
      };

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
        pendingInvite = {
          ...pendingInvite,
          emailStatus: "sent",
          inviteSentAt: new Date().toISOString(),
          emailError: null,
        };
        await inviteRef.set({
          emailStatus: "sent" as InviteEmailStatus,
          inviteSentAt: FieldValue.serverTimestamp(),
          emailError: null,
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      } catch (emailErr: unknown) {
        inviteEmailStatus = "failed";
        inviteEmailError = emailErr instanceof Error ? emailErr.message : "Failed to send invite email.";
        pendingInvite = {
          ...pendingInvite,
          emailStatus: "failed",
          emailError: inviteEmailError,
        };
        logger.error("assignStationUser: invite email failed", {
          email: normalizedEmail,
          inviteId,
          message: inviteEmailError,
        });
        await inviteRef.set({
          emailStatus: "failed" as InviteEmailStatus,
          inviteSentAt: null,
          emailError: inviteEmailError,
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      }

      res.status(200).json({
        uid: inviteId,
        email: normalizedEmail,
        firstName,
        lastName,
        stationDirectoryId,
        stationSourceId,
        stationName,
        assignedUserCount: 0,
        assignmentStatus: "pending",
        inviteStatus: "pending",
        inviteEmailStatus,
        inviteEmailError,
        inviteDeliveryMethod: "smtp-html",
        isNewUser: true,
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
        new HttpsError("internal", "Failed to send station invite."),
      );
    }
  }
);
