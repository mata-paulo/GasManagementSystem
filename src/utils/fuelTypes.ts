/**
 * Fuel type hierarchy: main types → subtypes.
 *
 * Mirror of functions/src/utils/fuelTypes.ts for frontend use.
 * Main types: Gasoline, Diesel
 * Subtypes reflect Philippine market fuel grades (octane / cetane).
 */

export const FUEL_MAIN_TYPES = ["Gasoline", "Diesel"] as const;
export type FuelMainType = (typeof FUEL_MAIN_TYPES)[number];

export interface FuelSubType {
  id: string;
  label: string;
  mainType: FuelMainType;
}

export const FUEL_SUB_TYPES: readonly FuelSubType[] = [
  // Gasoline subtypes (by octane rating)
  { id: "unleaded-91", label: "Regular/Unleaded 91", mainType: "Gasoline" },
  { id: "premium-95", label: "Premium 95", mainType: "Gasoline" },
  { id: "super-97", label: "Super Premium 97", mainType: "Gasoline" },
  // Diesel subtypes
  { id: "diesel-regular", label: "Diesel", mainType: "Diesel" },
  { id: "diesel-premium", label: "Premium Diesel", mainType: "Diesel" },
] as const;

export const VALID_FUEL_SUB_TYPE_IDS = FUEL_SUB_TYPES.map((s) => s.id);

/** Get subtypes for a given main fuel type. */
export function getSubTypesFor(mainType: FuelMainType): FuelSubType[] {
  return FUEL_SUB_TYPES.filter((s) => s.mainType === mainType);
}

/** Get the main type from a subtype ID. Returns undefined if not found. */
export function getMainTypeFromSubTypeId(subTypeId: string): FuelMainType | undefined {
  return FUEL_SUB_TYPES.find((s) => s.id === subTypeId)?.mainType;
}

/** Get the display label for a subtype ID. */
export function getSubTypeLabel(subTypeId: string): string {
  return FUEL_SUB_TYPES.find((s) => s.id === subTypeId)?.label ?? subTypeId;
}
