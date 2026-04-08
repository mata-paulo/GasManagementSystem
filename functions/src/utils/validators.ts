import {z} from "zod";

/** Align with `Register.tsx` plate input `maxLength={10}`. */
export const PLATE_MAX_LENGTH = 10;

/**
 * Philippine plate format: alphanumeric with optional spaces or hyphens as separators.
 * Covers old (AB 1234 / AB-1234), new (ABC 1234 / ABC-1234), motorcycle (DA93600), etc.
 */
const PLATE_FORMAT_REGEX = /^[A-Z0-9]([A-Z0-9 -]*[A-Z0-9])?$/i;

/** Strips ALL non-alphanumeric characters for duplicate comparison. */
export function normalizePlate(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

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
  vehicleType: vehicleTypeSchema,
  plate: z
    .string()
    .trim()
    .min(1, "Plate number is required.")
    .max(PLATE_MAX_LENGTH, `Plate number must be at most ${PLATE_MAX_LENGTH} characters.`)
    .regex(PLATE_FORMAT_REGEX, "Plate number may only contain letters, numbers, spaces, and hyphens (e.g. ABC-1234)."),
  gasType: z
    .string()
    .trim()
    .min(1, "Fuel type is required.")
    .refine((v) => GASES.includes(v), "Invalid fuel type selected."),
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
  // Optional second vehicle
  vehicle2Type: vehicleTypeSchema.optional(),
  vehicle2Plate: z
    .string()
    .trim()
    .max(PLATE_MAX_LENGTH, `Plate must be at most ${PLATE_MAX_LENGTH} characters.`)
    .regex(PLATE_FORMAT_REGEX, "Plate number may only contain letters, numbers, spaces, and hyphens (e.g. ABC-1234).")
    .optional(),
  vehicle2GasType: z
    .string()
    .trim()
    .refine((v) => GASES.includes(v), "Invalid fuel type.")
    .optional(),
  vehicles: z.array(
    z.object({
      type: vehicleTypeSchema,
      plate: z.string().trim().min(1, "Plate is required.").max(PLATE_MAX_LENGTH, `Plate must be at most ${PLATE_MAX_LENGTH} characters.`).regex(PLATE_FORMAT_REGEX, "Plate number may only contain letters, numbers, spaces, and hyphens (e.g. ABC-1234)."),
      gasType: z.string().trim().refine((v) => GASES.includes(v), "Invalid fuel type."),
    })
  ).min(1).max(5, "Maximum of 5 vehicles allowed.").optional(),
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
