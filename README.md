# Gas Management System

> A full-stack fuel allocation application built with React, Vite, Firebase, and Cloud Functions.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth%20%7C%20Functions-FFCA28?logo=firebase&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-Private-red)

The frontend is organized by feature so resident, station, admin, and account screens stay grouped with their own concerns. Shared UI, Firebase setup, and reusable helpers live outside feature folders to keep the app easier to scale.

---

## Features (Implemented)

### Resident

- Dashboard with **per-vehicle weekly allocation** (used/remaining) + recent transactions
- Personal **QR code** (view + download as PNG)
- **Transaction history** (per vehicle)
- **Nearby stations map** (Leaflet / OpenStreetMap)
- Vehicle management (**up to 5 vehicles**)
- Account settings + change password

### Station Officer

- **QR scanner** → validate resident + dispense fuel
- Allocation enforcement (caps to remaining weekly liters) + idempotent `scanId`
- Station dashboard (inventory, recent transactions, totals)
- Fuel inventory & pricing setup
- Transaction history + CSV export
- Manual Online/Offline presence toggle

### Admin

- System overview dashboard (residents/stations/transactions)
- **Station heatmap** (Leaflet) with weekly aggregation (`weeklyHeatmap/{weekKey}`)
- Residents, stations, users, transactions, and analytics views
- Station user invites (generate registration link + attempt email delivery)

---

## Table of Contents

- [Quickstart](#quickstart)
- [Features (Implemented)](#features-implemented)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)
- [Scripts](#scripts)
- [Admin Role](#admin-role)
- [Live Data Model](#live-data-model)
- [Resident and Station Flow](#resident-and-station-flow)
- [Frontend Structure](#frontend-structure)
- [Notes](#notes)

---

## Quickstart

```bash
# 1. Install frontend dependencies
npm install

# 2. Install Cloud Functions dependencies
npm --prefix functions install

# 3. Copy environment variables and fill in values
cp .env.example .env

# 4. Start local Firebase emulators
npm run emulators

# 5. (Optional) Seed emulator with test data
npm run seed:emulator

# 6. Start the dev server (http://localhost:5173)
npm run dev
```

> **Required env vars:** `VITE_FIREBASE_*` (project config). See [Environment Variables](./docs/ENVIRONMENT.md) for the full list.

---

## Documentation

| Document | Description |
|---|---|
| [Project Setup](./docs/SETUP.md) | Installation, registration UI, mobile notes |
| [Architecture](./docs/ARCHITECTURE.md) | Feature structure, data flow, design decisions |
| [Station Heatmap](./docs/HEATMAP.md) | Leaflet map, weekly aggregation, Cloud Function |
| [Environment Variables](./docs/ENVIRONMENT.md) | All required and optional env vars |
| [Troubleshooting](./docs/TROUBLESHOOTING.md) | Common errors and fixes |
| [Change Summary](./docs/CHANGE_SUMMARY.md) | Recent notable changes |
| [Firestore Analysis](./docs/FIRESTORE_ANALYSIS.md) | Collection structure and read/write patterns |

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19, TypeScript, Tailwind CSS |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod |
| Build | Vite 8 |
| Auth | Firebase Auth |
| Database | Cloud Firestore |
| Backend | Firebase Cloud Functions |
| Hosting | Firebase Hosting |
| Maps | Leaflet / OpenStreetMap |
| QR | qrcode.react, jsQR |
| Testing | Vitest, Testing Library |

---

## Scripts

### Frontend

```bash
npm run dev              # Start dev server (0.0.0.0:5173)
npm run build            # Production build
npm run preview          # Preview production build locally
npm run typecheck        # TypeScript type check (no emit)
npm run lint             # ESLint (zero warnings policy)
npm run test             # Run tests once (Vitest)
npm run test:watch       # Run tests in watch mode
```

### Functions & Emulators

```bash
npm run functions:build  # Build Cloud Functions
npm run functions:test   # Run Cloud Functions tests
npm run emulators        # Start all Firebase emulators
npm run seed:emulator    # Seed emulator with test data
npm run seed:stations    # Seed station directory from STATIC_STATIONS
```

### Admin Bootstrap

Create the first admin account (runs against the deployed project or emulator):

```bash
npm --prefix functions run admin:provision -- \
  --email admin@example.com \
  --password your-password \
  --first-name Admin \
  --last-name User
```

> Do **not** expose a public admin registration screen. Use `admin:provision` to create or promote admin accounts.

`seed:stations` populates the station directory from `STATIC_STATIONS`, including default brand prices, brand colors, and matching admin mock station metadata.

---

## Admin Role

- Admin users authenticate through the same login screen as residents and stations.
- After sign-in the app reads `accounts/{uid}` from Firestore and routes `role: admin` into the admin portal.
- The admin dashboard uses live Firestore `accounts` and `transactions` data.
- The **Heatmap** page renders a Leaflet/OpenStreetMap map of all gas stations:
  - Circle **color** (blue → yellow → red) reflects weekly transaction count (demand).
  - Circle **radius** reflects weekly liters dispensed (volume).
  - Data is pre-aggregated hourly by a Cloud Function into `weeklyHeatmap/{weekKey}` and polled every 60 minutes — keeping Firestore reads to 1 document per poll regardless of transaction volume.
- Admin sidebar pages are URL-backed under `/admin/...`, so refresh and browser navigation preserve the current section.
- Station officer/user onboarding uses a **token-based registration link** generated by the backend (`assignStationUser`). The admin UI can generate a link, attempt email delivery, and also copy/send the link manually.
- Station **status** is presence-based: offline when no users are assigned or all assigned users are offline; online when at least one assigned station user is actively online.

---

## Live Data Model

### Resident accounts — `accounts/{uid}`

| Field | Description |
|---|---|
| `firstName`, `lastName` | Display name |
| `barangay` | Registered barangay |
| `gasType` | `gasoline` or `diesel` |
| `vehicles[]` | Up to 5 vehicles; each entry includes `plate`, `type`, `gasType`, and per-vehicle weekly fields like `fuelAllocated`, `fuelUsed`, `fuelWeekKey` |
| `plateNormalizedList[]` | Normalized plates for uniqueness checks / lookups |

### Station accounts — `accounts/{uid}`

Stores assignment + presence fields (e.g. `presenceStatus`, `assignmentStatus`, `stationDirectoryId`) alongside the common account fields.

> Station fuel inventory and pricing are sourced from `stationDirectory/{stationUid}.fuels[]` and merged into the station portal views.

### Station directory — `stationDirectory/{stationUid}`

| Field | Description |
|---|---|
| `name`, `brand`, `barangay` | Station metadata shown across resident/admin views |
| `lat`, `lon` | Pinned station coordinates used for maps |
| `fuels[]` | Canonical per-fuel config: `label`, `capacityLiters`, `currentCapacity`, `price`, and `dispensed` (lifetime) |

### Transactions — `transactions/{id}`

| Field | Description |
|---|---|
| `plate` | Resident plate |
| `residentUid` | Resident UID |
| `stationUid` | Dispensing station UID |
| `stationName`, `stationBrand` | Station labels used by admin analytics and receipts |
| `vehicleType` | Vehicle type for the dispense (from QR or account) |
| `fuelType` | Fuel product dispensed (label) |
| `liters` | Volume dispensed |
| `pricePerLiter` | Price used for the dispense |
| `totalPaid` | Amount charged |
| `createdAt` / `occurredAt` | Timestamp |
| `weekKey` | ISO week key |
| `scanId` | Idempotency key (prevents duplicate dispense from the same QR scan) |

**Access rules:** Residents read only their own transactions; station users read only transactions from their station.

---

## Resident and Station Flow

1. **QR codes** are generated for residents and are decoded by station officers to start a dispense session. Current QR format supports plate-based payloads and UID-based payloads (backward-compatible decoding).
2. **Station QR validation** resolves the resident account from Firestore and selects the matching vehicle (by plate when available).
3. **Allocation checks** enforce the resident’s remaining weekly allocation (per-vehicle) and cap the dispense to the remaining liters.
4. **Dispense** writes a `transactions` record and updates both station fuel inventory (in `stationDirectory`) and the resident’s per-vehicle weekly usage.
5. The dispense flow includes `scanId` idempotency so repeated submissions from the same scan do not create duplicate transactions.
6. Mobile **registration** uses a barangay picker sheet with 16 px inputs to avoid iOS Safari focus zoom — see [Setup](./docs/SETUP.md#registration-ui-mobile).

---

## Frontend Structure

```text
src/
  app/                        # App shell, router, providers
  features/
    account/                  # Account settings screens
    admin/                    # Admin portal pages and components
    auth/                     # Login, registration flows
    resident/                 # Resident dashboard, QR card, nearby stations
    station/                  # Station dispense flow, inventory
  lib/
    auth/                     # Auth helpers and hooks
    data/                     # Firestore data access layer
    firebase/                 # Firebase app initialization
    qr/                       # QR encode/decode utilities
  shared/
    components/               # Reusable UI components
    guards/                   # Route guards (auth, role)
```

Path aliases use `@/` and resolve from `src/`.

---

## Notes

- Local Vite development proxies `/api/*` directly to the Cloud Functions origin, not to Firebase Hosting.
- Resident registration uses the emulator URL when emulators are enabled, and otherwise calls the deployed Cloud Function directly during local dev.
- Admin station-user invites use `/api/assignStationUser` in local dev so browser CORS does not block the request.
- Week boundaries follow **ISO 8601** (week starts Monday).