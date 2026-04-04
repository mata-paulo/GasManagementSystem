import * as admin from "firebase-admin";
import {FieldValue} from "firebase-admin/firestore";

type CliArgs = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function parseArgs(): CliArgs | null {
  const email = readArg("--email")?.trim().toLowerCase() ?? "";
  const password = readArg("--password")?.trim() ?? "";
  const firstName = readArg("--first-name")?.trim() || undefined;
  const lastName = readArg("--last-name")?.trim() || undefined;

  if (!email || !password) {
    return null;
  }

  return {email, password, firstName, lastName};
}

function printUsage(): void {
  console.error(
    "Usage: npm --prefix functions run admin:provision -- " +
      "--email admin@example.com --password your-password " +
      "[--first-name Admin] [--last-name User]"
  );
}

async function ensureAdminUser(args: CliArgs): Promise<void> {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }

  const displayName = [args.firstName, args.lastName].filter(Boolean).join(" ").trim();

  let userRecord: admin.auth.UserRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(args.email);
    if (displayName) {
      await admin.auth().updateUser(userRecord.uid, {displayName});
      userRecord = await admin.auth().getUser(userRecord.uid);
    }
  } catch (err: unknown) {
    const code = typeof err === "object" && err && "code" in err ?
      String((err as {code?: string}).code) :
      "";

    if (code !== "auth/user-not-found") {
      throw err;
    }

    userRecord = await admin.auth().createUser({
      email: args.email,
      password: args.password,
      displayName: displayName || undefined,
    });
  }

  const accountRef = admin.firestore().collection("accounts").doc(userRecord.uid);
  const accountSnapshot = await accountRef.get();

  await accountRef.set({
    email: args.email,
    role: "admin",
    firstName: args.firstName ?? "",
    lastName: args.lastName ?? "",
    updatedAt: FieldValue.serverTimestamp(),
    ...(accountSnapshot.exists ? {} : {registeredAt: FieldValue.serverTimestamp()}),
  }, {merge: true});

  console.log(
    `Admin account ready: ${args.email} (${userRecord.uid})` +
      (accountSnapshot.exists ? " [updated]" : " [created]")
  );
}

async function main(): Promise<void> {
  const args = parseArgs();
  if (!args) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  try {
    await ensureAdminUser(args);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to provision admin: ${message}`);
    process.exitCode = 1;
  }
}

void main();
