import {setGlobalOptions} from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

if (process.env.FUNCTIONS_EMULATOR === "true") {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.warn(
      "[functions] FIRESTORE_EMULATOR_HOST is unset — Admin SDK may call production Firestore."
    );
  }
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.warn(
      "[functions] FIREBASE_AUTH_EMULATOR_HOST is unset — Admin Auth may target production."
    );
  }
}

setGlobalOptions({maxInstances: 10});

export {registerResident} from "./auth/registerResident";
export {assignStationUser} from "./auth/assignStationUser";
export {syncResidentFuelCycle} from "./auth/syncResidentFuelCycle";
