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
