import * as admin from "firebase-admin";
import {FieldValue, GeoPoint} from "firebase-admin/firestore";
import * as fs from "node:fs";
import * as path from "node:path";

type ResidentCatalogStation = {
  id: number;
  name: string;
  brand: string;
  address: string;
  rating: number | null;
  hours: string;
  lat: number;
  lon: number;
};

type AdminMockStation = {
  id: number;
  name: string;
  brand: string;
  barangay: string;
  officer: string;
  capacity: number;
  dispensed: number;
  lat: number;
  lng: number;
  status: string;
};

type BrandPrice = {
  label: string;
  price: number;
};

type BrandColor = {
  bg: string;
  text: string;
  dot: string;
};

type AdminMockCatalog = {
  stationsById: Map<number, AdminMockStation>;
  brandPrices: Record<string, BrandPrice[]>;
  brandColors: Record<string, BrandColor>;
};

function readProjectIdFromEnvSource(source: string): string | undefined {
  for (const key of ["VITE_FIREBASE_PROJECT_ID", "VITE_PUBLIC_FIREBASE_PROJECT_ID"]) {
    const match = source.match(
      new RegExp(`^${key}\\s*=\\s*["']?([^"'\\r\\n]+)["']?\\s*$`, "m")
    );
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }
  return undefined;
}

function readProjectIdFromEnvFile(): string | undefined {
  const candidates = [
    path.resolve(process.cwd(), "..", ".env.local"),
    path.resolve(process.cwd(), "..", ".env"),
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const source = fs.readFileSync(candidate, "utf8");
    const id = readProjectIdFromEnvSource(source);
    if (id) return id;
  }

  return undefined;
}

function getProjectId(): string | undefined {
  return (
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    readProjectIdFromEnvFile()
  );
}

function getSourceFilePath(relativePath: string): string {
  const candidates = [
    path.resolve(process.cwd(), "..", relativePath),
    path.resolve(process.cwd(), relativePath),
  ];

  const match = candidates.find((candidate) => fs.existsSync(candidate));
  if (!match) {
    throw new Error(`Could not locate ${relativePath}`);
  }

  return match;
}

function extractConstValue(source: string, constName: string, nextToken: string): unknown {
  const pattern = new RegExp(
    `const\\s+${constName}(?:\\s*:[^=]+)?\\s*=\\s*([\\s\\S]*?)\\s*;\\r?\\n\\r?\\n${nextToken}`
  );
  const match = source.match(pattern);

  if (!match?.[1]) {
    throw new Error(`Could not parse ${constName}`);
  }

  return Function(`"use strict"; return (${match[1]});`)() as unknown;
}

function loadResidentStaticStations(): ResidentCatalogStation[] {
  const source = fs.readFileSync(
    getSourceFilePath(path.join("src", "features", "resident", "pages", "NearbyStations.tsx")),
    "utf8"
  );
  const stations = extractConstValue(source, "STATIC_STATIONS", "function normalizeBrandKey");

  if (!Array.isArray(stations)) {
    throw new Error("Parsed STATIC_STATIONS value is not an array");
  }

  return stations.map((station) => {
    const item = station as Partial<ResidentCatalogStation>;
    if (
      typeof item.id !== "number" ||
      typeof item.name !== "string" ||
      typeof item.brand !== "string" ||
      typeof item.address !== "string" ||
      typeof item.hours !== "string" ||
      typeof item.lat !== "number" ||
      typeof item.lon !== "number"
    ) {
      throw new Error("STATIC_STATIONS contains an invalid station record");
    }

    return {
      id: item.id,
      name: item.name,
      brand: item.brand,
      address: item.address,
      rating: typeof item.rating === "number" ? item.rating : null,
      hours: item.hours,
      lat: item.lat,
      lon: item.lon,
    };
  });
}

function loadAdminMockCatalog(): AdminMockCatalog {
  const source = fs.readFileSync(
    getSourceFilePath(path.join("src", "features", "admin", "pages", "AdminDashboard.tsx")),
    "utf8"
  );
  const stations = extractConstValue(source, "STATIC_STATIONS", "const STATIC_RESIDENTS");
  const brandPrices = extractConstValue(source, "DEFAULT_BRAND_PRICES", "const BRAND_COLORS");
  const brandColors = extractConstValue(source, "BRAND_COLORS", "const NAV_ITEMS");

  if (!Array.isArray(stations)) {
    throw new Error("Parsed admin STATIC_STATIONS value is not an array");
  }

  if (!isBrandPriceRecord(brandPrices)) {
    throw new Error("Parsed DEFAULT_BRAND_PRICES value is invalid");
  }

  if (!isBrandColorRecord(brandColors)) {
    throw new Error("Parsed BRAND_COLORS value is invalid");
  }

  const stationsById = new Map<number, AdminMockStation>();
  for (const station of stations) {
    const item = station as Partial<AdminMockStation>;
    if (
      typeof item.id !== "number" ||
      typeof item.name !== "string" ||
      typeof item.brand !== "string" ||
      typeof item.barangay !== "string" ||
      typeof item.officer !== "string" ||
      typeof item.capacity !== "number" ||
      typeof item.dispensed !== "number" ||
      typeof item.lat !== "number" ||
      typeof item.lng !== "number" ||
      typeof item.status !== "string"
    ) {
      throw new Error("Admin STATIC_STATIONS contains an invalid station record");
    }

    stationsById.set(item.id, {
      id: item.id,
      name: item.name,
      brand: item.brand,
      barangay: item.barangay,
      officer: item.officer,
      capacity: item.capacity,
      dispensed: item.dispensed,
      lat: item.lat,
      lng: item.lng,
      status: item.status,
    });
  }

  return {stationsById, brandPrices, brandColors};
}

function isBrandPriceRecord(value: unknown): value is Record<string, BrandPrice[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entries) =>
    Array.isArray(entries) &&
    entries.every((entry) =>
      !!entry &&
      typeof entry === "object" &&
      typeof (entry as Partial<BrandPrice>).label === "string" &&
      typeof (entry as Partial<BrandPrice>).price === "number"
    )
  );
}

function isBrandColorRecord(value: unknown): value is Record<string, BrandColor> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) =>
    !!entry &&
    typeof entry === "object" &&
    typeof (entry as Partial<BrandColor>).bg === "string" &&
    typeof (entry as Partial<BrandColor>).text === "string" &&
    typeof (entry as Partial<BrandColor>).dot === "string"
  );
}

function normalizeBrand(brand: string): string {
  const value = brand.trim().toLowerCase();
  if (value === "seaoil") return "Sea Oil";
  return brand.trim();
}

async function seedStationDirectory(): Promise<void> {
  if (admin.apps.length === 0) {
    const projectId = getProjectId();
    admin.initializeApp(projectId ? {projectId} : undefined);
  }

  const stations = loadResidentStaticStations();
  const adminCatalog = loadAdminMockCatalog();
  const db = admin.firestore();
  const batch = db.batch();

  for (const station of stations) {
    const normalizedBrand = normalizeBrand(station.brand);
    const adminStation = adminCatalog.stationsById.get(station.id);
    const docRef = db.collection("stationDirectory").doc(String(station.id));
    batch.set(docRef, {
      source: "STATIC_STATIONS",
      sourceId: station.id,
      name: station.name,
      brand: normalizedBrand,
      address: station.address,
      rating: station.rating,
      hours: station.hours,
      lat: station.lat,
      lon: station.lon,
      location: new GeoPoint(station.lat, station.lon),
      brandPrices: adminCatalog.brandPrices[normalizedBrand] ?? adminCatalog.brandPrices.Other ?? [],
      brandColors: adminCatalog.brandColors[normalizedBrand] ?? adminCatalog.brandColors.Other ?? null,
      barangay: adminStation?.barangay ?? null,
      officer: adminStation?.officer ?? null,
      capacity: adminStation?.capacity ?? null,
      dispensed: adminStation?.dispensed ?? null,
      status: adminStation?.status ?? "Unknown",
      mockStationName: adminStation?.name ?? null,
      mockCoordinates: adminStation
        ? {
            lat: adminStation.lat,
            lng: adminStation.lng,
          }
        : null,
      hasMockData: Boolean(adminStation),
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});
  }

  await batch.commit();
  console.log(`Seeded ${stations.length} station directory records into stationDirectory.`);
}

async function main(): Promise<void> {
  try {
    await seedStationDirectory();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Could not load the default credentials")) {
      console.error(
        "Failed to seed station directory: Firebase credentials are missing.\n" +
        "For emulators, set FIRESTORE_EMULATOR_HOST and a project ID.\n" +
        "For a live project, run `gcloud auth application-default login` or set GOOGLE_APPLICATION_CREDENTIALS."
      );
      process.exitCode = 1;
      return;
    }
    console.error(`Failed to seed station directory: ${message}`);
    process.exitCode = 1;
  }
}

void main();
