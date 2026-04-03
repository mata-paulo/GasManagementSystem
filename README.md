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
npm run seed:emulator
npm run emulators
```

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
    firebase/
    qr/
  shared/
    components/
    guards/
```

## Notes

- Local Vite development does not use Firebase Hosting rewrites automatically.
- Resident registration uses the emulator URL when emulators are enabled, and otherwise calls the deployed Cloud Function directly during local dev.
- Path aliases use `@/` and resolve from `src/`.
