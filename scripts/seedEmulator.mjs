import net from "node:net";
import {spawn} from "node:child_process";

const FIRESTORE_HOST = "127.0.0.1";
const FIRESTORE_PORT = 8080;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const firebaseCommand = process.platform === "win32" ? "firebase.cmd" : "firebase";

function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({host, port});

    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function run(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      ...extraEnv,
    };
    const child = process.platform === "win32"
      ? spawn(
        [command, ...args.map((arg) => /\s/.test(arg) ? `"${arg}"` : arg)].join(" "),
        {
          stdio: "inherit",
          shell: true,
          env,
        }
      )
      : spawn(command, args, {
        stdio: "inherit",
        shell: false,
        env,
      });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code ?? "unknown"}`));
    });
  });
}

async function main() {
  const emulatorHost = `${FIRESTORE_HOST}:${FIRESTORE_PORT}`;
  const emulatorRunning = await isPortOpen(FIRESTORE_HOST, FIRESTORE_PORT);

  if (emulatorRunning) {
    console.log(`Using existing Firestore emulator at ${emulatorHost}.`);
    await run(npmCommand, ["--prefix", "functions", "run", "seed:stations"], {
      FIRESTORE_EMULATOR_HOST: emulatorHost,
    });
    return;
  }

  console.log(`Starting a temporary Firestore emulator at ${emulatorHost} for seeding.`);
  await run(firebaseCommand, [
    "emulators:exec",
    "--only",
    "firestore",
    "npm --prefix functions run seed:stations",
  ]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
