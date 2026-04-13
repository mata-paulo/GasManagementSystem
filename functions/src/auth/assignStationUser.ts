import {onRequest, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {randomBytes} from "node:crypto";
import type {Request, Response} from "express";
import nodemailer from "nodemailer";
import {
  assignStationUserSchema,
  CORS,
  type AssignStationUserInput,
} from "../utils/validators";

type RegistrationTokenResponse = {
  /** Pre-auth account document id (pending registration). */
  uid: string;
  token: string;
  link: string;
  email: string;
  firstName: string;
  lastName: string;
  emailStatus: "queued" | "sent" | "failed";
  expiresAt: string;
  emailError?: string | null;
};

// Registration token expiry window. Change this to adjust token validity.
const STATION_REGISTRATION_TOKEN_TTL_DAYS = 3;

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
  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn("assignStationUser: token verification failed", {message: msg});
    throw new HttpsError("unauthenticated", "Invalid or expired admin authorization token.");
  }
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

// Generic station invites do not use stationDirectory fuel templates.

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is not configured.`);
  }
  return value.trim();
}

function getAppBaseUrl(): string {
  return process.env.APP_BASE_URL?.trim() || "https://agas.ph";
}

/**
 * Generate a unique, short registration token (12 alphanumeric characters).
 * Used for one-time use registration links.
 */
function generateRegistrationToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  const bytes = randomBytes(9);
  for (let i = 0; i < 9; i++) {
    token += chars[bytes[i] % chars.length];
  }
  return token;
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

function formatSmtpError(err: unknown): string {
  if (err instanceof Error) {
    const anyErr = err as unknown as {
      code?: unknown;
      command?: unknown;
      responseCode?: unknown;
    };
    const code = typeof anyErr.code === "string" ? anyErr.code : "";
    const command = typeof anyErr.command === "string" ? anyErr.command : "";
    const responseCode =
      typeof anyErr.responseCode === "number" ? String(anyErr.responseCode) : "";

    const details = [
      code && `code=${code}`,
      command && `command=${command}`,
      responseCode && `responseCode=${responseCode}`,
    ].filter(Boolean).join(" ");

    return details ? `${err.message} (${details})` : err.message;
  }
  return typeof err === "string" ? err : "Failed to send registration email.";
}

async function sendStationRegistrationEmail(args: {
  email: string;
  firstName: string;
  registrationLink: string;
}): Promise<void> {
  const transporter = buildInviteTransport();
  const fromEmail = getRequiredEnv("SMTP_FROM_EMAIL");
  const fromName = process.env.SMTP_FROM_NAME?.trim() || "AGAS";
  const safeFirstName = escapeHtml(args.firstName);
  const safeLink = escapeHtml(args.registrationLink);

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: args.email,
    subject: "AGAS Station Registration",
    text: [
      `Hello ${args.firstName},`,
      "",
      "You have been invited to register as a station officer in AGAS.",
      "Use the secure link below to complete your registration and set your password:",
      args.registrationLink,
      "",
      "This link will expire in 3 days.",
      "If you were not expecting this invite, you can ignore this message.",
    ].join("\n"),
    html: `
      <div style="margin:0;padding:32px 16px;background:#edf3f8;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:640px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#003366 0%,#0b4f8a 100%);border-radius:28px 28px 0 0;padding:28px 32px;">
            <div style="display:inline-block;background:rgba(255,255,255,0.14);color:#facc15;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;padding:8px 12px;border-radius:999px;">
              AGAS Station Registration
            </div>
            <h1 style="margin:18px 0 8px;font-size:30px;line-height:1.15;color:#ffffff;font-weight:800;">
              Complete Your Station Registration
            </h1>
            <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.84);">
              You have been invited to register as a station officer in AGAS. Click below to get started.
            </p>
          </div>

          <div style="background:#ffffff;border:1px solid #dbe7f2;border-top:0;border-radius:0 0 28px 28px;padding:32px;">
            <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">
              Hello <strong>${safeFirstName}</strong>,
            </p>

            <p style="margin:0 0 22px;font-size:15px;line-height:1.8;color:#334155;">
              Click the button below to complete your station registration and create your password.
            </p>

            <div style="margin-bottom:24px;">
              <a href="${safeLink}"
                 style="display:inline-block;background:#003366;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:15px 24px;border-radius:14px;box-shadow:0 10px 24px rgba(0,51,102,0.18);">
                Register Now
              </a>
            </div>

            <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:18px;padding:16px 18px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;line-height:1.7;color:#0c4a6e;">
                This link will expire in <strong>3 days</strong> and can only be used once.
              </p>
            </div>

            <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">
              Or Copy This Link
            </p>
            <p style="margin:0;font-size:13px;line-height:1.8;word-break:break-all;color:#1565c0;">
              <a href="${safeLink}" style="color:#1565c0;text-decoration:none;">${safeLink}</a>
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

      // Token-based registration flow:
      // - Generate a unique registration token
      // - Create an accounts document with the token
      // - Build registration link with token
      // - Send SMTP email with link
      // - Return token and link to frontend
      const registrationToken = generateRegistrationToken();
      const pendingAccountUid = randomBytes(16).toString("hex");
      const accountRef = db.collection("accounts").doc(pendingAccountUid);
      const expiresAtDate = new Date(Date.now() + STATION_REGISTRATION_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
      const baseUrl = getAppBaseUrl().replace(/\/$/, "");
      const registrationLink = `${baseUrl}/?register=station&token=${registrationToken}`;
      let emailStatus: "queued" | "sent" | "failed" = "queued";
      let emailError: string | null = null;

      // Create account document with registration token
      await accountRef.set({
        registrationToken: {
          token: registrationToken,
          createdAt: FieldValue.serverTimestamp(),
          expiresAt: Timestamp.fromDate(expiresAtDate),
          used: false,
          createdByUid: adminUid,
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Send SMTP email with registration link
      try {
        await sendStationRegistrationEmail({
          email: normalizedEmail,
          firstName,
          registrationLink,
        });

        emailStatus = "sent";
        // Update account with successful email status
        await accountRef.set({
          registrationToken: {
            ...{
              token: registrationToken,
              createdAt: FieldValue.serverTimestamp(),
              expiresAt: Timestamp.fromDate(expiresAtDate),
              used: false,
            },
            emailSentAt: FieldValue.serverTimestamp(),
            emailStatus: "sent",
          },
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      } catch (emailErr: unknown) {
        emailStatus = "failed";
        emailError = formatSmtpError(emailErr);
        logger.error(
          "assignStationUser: registration email failed",
          {email: normalizedEmail, uid: pendingAccountUid, error: emailError},
          emailErr,
        );
        // Update account with failed email status
        await accountRef.set({
          registrationToken: {
            ...{
              token: registrationToken,
              createdAt: FieldValue.serverTimestamp(),
              expiresAt: Timestamp.fromDate(expiresAtDate),
              used: false,
            },
            emailStatus: "failed",
            emailError,
          },
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      }

      const response: RegistrationTokenResponse = {
        uid: pendingAccountUid,
        token: registrationToken,
        link: registrationLink,
        email: normalizedEmail,
        firstName,
        lastName,
        emailStatus,
        expiresAt: expiresAtDate.toISOString(),
        emailError,
      };

      res.status(200).json(response);
    } catch (err: unknown) {
      if (err instanceof HttpsError) {
        sendHttpsError(res, err);
        return;
      }

      logger.error("assignStationUser: unhandled error", err);
      sendHttpsError(
        res,
        new HttpsError("internal", "Failed to send station invite."),
      );
    }
  }
);
