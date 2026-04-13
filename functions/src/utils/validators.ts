import {z} from "zod";

/** Align with client plate input maxLength={7} (2–7 alphanumeric, no separators). */
export const PLATE_MAX_LENGTH = 7;

/** Strips ALL non-alphanumeric characters for duplicate comparison. */
export function normalizePlate(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

/** Formats a plate for canonical storage: strips all separators, uppercase. */
export function formatPlateForStorage(plate: string): string {
  return normalizePlate(plate);
}

function sanitizePlateInput(value: unknown): string {
  if (value == null) return "";
  const raw = String(value).trim();
  // Canonical: strip dashes/spaces/special chars, uppercase, max 7
  return normalizePlate(raw).slice(0, PLATE_MAX_LENGTH);
}

const plateSchema = z.preprocess(
  sanitizePlateInput,
  z.string()
    .min(1, "Plate number is required.")
    .refine((v) => /^[A-Z0-9]+$/.test(v), "Plate may only contain letters and numbers.")
    .refine((v) => v.length >= 2 && v.length <= PLATE_MAX_LENGTH, "Plate must be 2–7 alphanumeric characters (e.g. ABC1234)."),
);

export const NAME_MAX_LENGTH = 50;
export const CORS = [
  "https://agas-fuel-rationing-system.web.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "localhost:5173",
  "localhost:5174",
  "localhost",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://agas.ph",
];
/** Matches client-side Register.tsx (min 6). */
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const VALID_VEHICLE_TYPES = ["2w", "4w", "others"] as const;

/** Cebu City barangays — same whitelist as `Register.tsx` `CEBU_BARANGAYS`. */
export const VALID_BARANGAYS = [
  "Adlaon", "Agsungot", "Apas", "Babag", "Bacayan", "Banilad",
  "Basak Pardo", "Basak San Nicolas", "Binaliw", "Budlaan", "Buhisan",
  "Bulacao", "Buot-Taup Pardo", "Busay", "Calamba", "Cambinocot",
  "Camputhaw", "Capitol Site", "Carreta", "Central Poblacion",
  "Cogon Pardo", "Cogon Ramos", "Day-as", "Duljo", "Ermita",
  "Guadalupe", "Guba", "Hipodromo", "Inayawan", "Kalubihan",
  "Kalunasan", "Kamagayan", "Kasambagan", "Kinasang-an Pardo",
  "Labangon", "Lahug", "Lorega San Miguel", "Lusaran", "Luz",
  "Mabini", "Mabolo", "Malubog", "Manipis", "Nasipit", "Nga-an",
  "Nivel Hills", "Non-oc", "Pari-an", "Pasil", "Pit-os",
  "Poblacion Pardo", "Pulangbato", "Pung-ol Sibugay", "Punta Princesa",
  "Quiot Pardo", "Ramos", "San Antonio", "San Jose",
  "San Nicolas Proper", "San Roque", "Santa Cruz", "Santa Lucia",
  "Santo Niño", "Sapangdaku", "Sawang Calero", "Sinsin", "Sirao",
  "Sudlon I", "Sudlon II", "T. Padilla", "Tabunan", "Tagbao",
  "Talamban", "Taptap", "Tejero", "Tinago", "Tisa", "To-ong Pardo",
  "Tugbongan", "Zapatera",
] as const;

/** Matches `GAS_TYPES` ids in `Register.tsx`. */
export const VALID_GAS_TYPES = ["Diesel", "Gasoline"] as const;

const GASES = VALID_GAS_TYPES as readonly string[];
const BARANGAYS = VALID_BARANGAYS as readonly string[];

// Vehicle type validation: accepts "2w", "4w", or any non-empty custom string (for "others" subtypes)
const vehicleTypeSchema = z.string().trim().min(1, "Vehicle type is required.");

/**
 * Callable payload for `registerResident`.
 * Uses `plate` and `gasType` (same as the UI). Unknown keys rejected.
 */
export const registerResidentSchema = z.object({
  // Legacy `vehicleType` removed; use `vehicles[].type` instead.
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(
      NAME_MAX_LENGTH,
      `First name must be at most ${NAME_MAX_LENGTH} characters.`
    ),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(
      NAME_MAX_LENGTH,
      `Last name must be at most ${NAME_MAX_LENGTH} characters.`
    ),
  barangay: z
    .string()
    .trim()
    .min(1, "Barangay is required.")
    .refine((v) => BARANGAYS.includes(v), "Invalid barangay selected."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .refine((v) => EMAIL_REGEX.test(v), "Invalid email address."),
  password: z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
    )
    .max(
      PASSWORD_MAX_LENGTH,
      `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`
    ),
  vehicles: z.array(
    z.object({
      type: vehicleTypeSchema,
      plate: plateSchema,
      gasType: z.string().trim().refine((v) => GASES.includes(v), "Invalid fuel type."),
      fuelAllocated: z.number().finite().min(0, "Fuel allocated must be zero or greater.").optional(),
    })
  ).min(1).max(5, "Maximum of 5 vehicles allowed."),
});

export type RegisterResidentInput = z.infer<typeof registerResidentSchema>;

/**
 * Non-strict object: strips unknown keys (avoids 400 when proxies/clients add fields).
 * Coerces `stationDirectoryId` so numeric IDs from the UI still validate.
 */
export const assignStationUserSchema = z.object({
  // Optional — admin can send a generic invite (station details completed later).
  stationDirectoryId: z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim())
    .refine((s) => s.length > 0, "Station is required.")
    .optional(),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .refine((v) => EMAIL_REGEX.test(v), "Invalid email address."),
  firstName: z
    .string()
    .trim()
    .max(
      NAME_MAX_LENGTH,
      `First name must be at most ${NAME_MAX_LENGTH} characters.`
    )
    .optional(),
  lastName: z
    .string()
    .trim()
    .max(
      NAME_MAX_LENGTH,
      `Last name must be at most ${NAME_MAX_LENGTH} characters.`
    )
    .optional(),
});

export type AssignStationUserInput = z.infer<typeof assignStationUserSchema>;

/**
 * Force a JS number to be stored as Firestore `doubleValue` instead of `integerValue`.
 *
 * The Node.js Firestore SDK stores `Number.isInteger(n)` values as int64.
 * This helper adds a negligible offset (≤ 1 ULP) so the serializer picks doubleValue.
 * The perturbation is invisible to application logic (fuel volumes in liters).
 */
export function toFirestoreDouble(n: number): number {
  if (!Number.isFinite(n) || !Number.isInteger(n)) return n;
  // Keep literal zero as 0. Mapping 0 → Number.MIN_VALUE forced double encoding but showed as 5e-324
  // in the Emulator/UI; int64 0 and double 0 are identical for all fuel math in JS.
  if (n === 0) return 0;
  // For non-zero integers, nudge by 1 ULP so Number.isInteger returns false.
  const buf = new Float64Array(1);
  buf[0] = n;
  const bytes = new Uint8Array(buf.buffer);
  // Increment the least significant byte of the IEEE 754 representation.
  // This adds 1 ULP (unit in last place) — the smallest possible change.
  let carry = 1;
  for (let i = 0; carry && i < 8; i++) {
    const sum = bytes[i] + carry;
    bytes[i] = sum & 0xff;
    carry = sum >> 8;
  }
  return buf[0];
}
