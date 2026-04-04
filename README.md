# Gas Management System

A full-stack fuel allocation application built with React, Vite, Firebase Auth, Firestore, Cloud Functions, and Firebase Hosting.

The frontend is organized by feature so resident, station, admin, and account screens stay grouped with their own concerns. Shared UI, Firebase setup, and reusable helpers live outside feature folders to keep the app easier to scale.

## Documentation

- [Project Setup](./docs/SETUP.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Environment Variables](./docs/ENVIRONMENT.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Firebase Auth
- Cloud Firestore
- Firebase Cloud Functions
- Firebase Hosting
- Mapbox GL

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
npm run lint
npm run test
npm run functions:build
npm run functions:test
npm run emulators
```

Functions-only admin bootstrap:

```bash
npm --prefix functions run admin:provision -- --email admin@example.com --password your-password --first-name Admin --last-name User
```

Seed the station directory from `STATIC_STATIONS`, including default brand prices, brand colors, and matching admin mock station metadata:

```bash
npm run seed:stations
```

## Admin Role

- Admin users authenticate through the same login screen as residents and stations.
- The app reads the Firestore `accounts/{uid}` document after sign-in and routes `role: "admin"` into the admin portal.
- The admin dashboard now uses live Firestore `accounts` and `transactions` data instead of static mock records.
- Admin sidebar pages are URL-backed under `/admin/...`, so refresh and browser navigation keep the current section.
- Station user invites are written to Firestore first, then a custom HTML email is sent by the backend so pending invites remain visible even when email delivery fails.
- Station status is presence-based: a station is offline when it has no assigned users, offline when all assigned users are offline, and online when at least one assigned station user is actively online.
- Do not expose a public admin registration screen. Create or promote admin accounts with the `admin:provision` script instead.

## Live Data Model

- Resident accounts are stored in `accounts/{uid}` with fields such as `firstName`, `lastName`, `plate`, `barangay`, `vehicleType`, `gasType`, `fuelAllocation`, `fuelUsed`, and `fuelWeekKey`.
- Resident weekly quota defaults to `20L`. New resident accounts start with `fuelUsed: 0`.
- Weekly quota is reset logically by week. When `fuelWeekKey` is from an older week, the frontend and station dispense flow treat the resident's current-week usage as `0`.
- Station accounts are also stored in `accounts/{uid}` and keep assignment, presence, fuel inventory, and pricing fields.
- Fuel purchases are written to the `transactions` collection with resident and station references, `plate`, `stationId`, `liters`, `amount`, `occurredAt`, and `weekKey`.
- Residents can read only their own transactions, while station users can read only transactions dispensed by their station account.

## Resident And Station Flow

- Resident QR codes now encode the resident Firebase Auth user ID.
- Station QR validation fetches the resident account from Firestore using that UID instead of relying on mock or reconstructed QR fields.
- Resident dashboard allocation and station dispense validation both use the live resident account plus current-week transaction context.
- Station dispense writes a live `transactions` record, updates station inventory, and advances the resident's current-week `fuelUsed`.

## Current Frontend Structure

```text
src/
  app/
  features/
    account/
    admin/
    auth/
    resident/
    station/
  lib/
    auth/
    data/
    firebase/
    qr/
  shared/
    components/
    guards/
```

## Notes

- Local Vite development proxies `/api/*` directly to the Cloud Functions origin, not to Firebase Hosting.
- Resident registration uses the emulator URL when emulators are enabled, and otherwise calls the deployed Cloud Function directly during local dev.
- Admin station-user invites use `/api/assignStationUser` in local dev so browser CORS does not block the request.
- Path aliases use `@/` and resolve from `src/`.
