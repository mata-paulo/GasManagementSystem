import {z} from "zod";

/** Align with `Register.tsx` plate input `maxLength={10}`. */
export const PLATE_MAX_LENGTH = 10;

export const NAME_MAX_LENGTH = 50;
export const CORS=[
      "https://agas-fuel-rationing-system.web.app",
      "http://localhost:5173",
      "localhost:5173",
      "localhost",
      "http://127.0.0.1:5173",
      "https://agas.ph",
    ];
/** Matches client-side Register.tsx (min 6). */
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const VALID_VEHICLE_TYPES = ["car", "truck", "motorcycle"] as const;

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

const VEHICLES = VALID_VEHICLE_TYPES as readonly string[];
const GASES = VALID_GAS_TYPES as readonly string[];
const BARANGAYS = VALID_BARANGAYS as readonly string[];

/**
 * Callable payload for `registerResident`.
 * Uses `plate` and `gasType` (same as the UI). Unknown keys rejected.
 */
export const registerResidentSchema = z.strictObject({
  vehicleType: z
    .string()
    .trim()
    .min(1, "Vehicle type is required.")
    .refine((v) => VEHICLES.includes(v), "Invalid vehicle type."),
  plate: z
    .string()
    .trim()
    .min(1, "Plate number is required.")
    .max(
      PLATE_MAX_LENGTH,
      `Plate number must be at most ${PLATE_MAX_LENGTH} characters.`
    ),
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
});

export type RegisterResidentInput = z.infer<typeof registerResidentSchema>;

export const assignStationUserSchema = z.strictObject({
  stationDirectoryId: z
    .string()
    .trim()
    .min(1, "Station is required."),
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
