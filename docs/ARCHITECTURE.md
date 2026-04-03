# Architecture

## Overview

This app is a feature-oriented React frontend backed by Firebase services.

Main responsibilities:

- Firebase Auth handles login and password flows
- Firestore stores account and application records
- Cloud Functions handle secure server-side registration logic
- Firebase Hosting serves the built SPA

## Frontend Structure

### `src/app`

Application shell and providers.

- `App.tsx`: main screen switching and role-based app flow
- `providers/AuthContext.tsx`: session restore, login state, logout behavior

### `src/features`

Feature-first modules grouped by business domain.

- `account/pages`: shared account screens like settings and password change
- `admin/pages`: admin-only dashboard flow
- `auth/pages`: landing, login, registration, password reset
- `resident/pages`: resident dashboard, QR display, map, history
- `station/pages`: station dashboard, scanner, validation, fuel setup, history

### `src/lib`

Non-visual app infrastructure.

- `auth/authService.ts`: Firebase Auth and Firestore-backed login logic
- `firebase/client.ts`: Firebase app initialization and emulator wiring
- `qr/qrCodec.ts`: QR encode/decode helpers

### `src/shared`

Reusable cross-feature building blocks.

- `components/layout/Header.tsx`
- `components/navigation/BottomNav.tsx`
- `guards/RoleGuard.tsx`

## Auth Flow

1. User logs in through the frontend.
2. Firebase Auth validates email/password.
3. The app loads the user profile from Firestore `accounts/{uid}`.
4. The returned role controls which screens are accessible.
5. Session data is stored in local storage and restored on refresh.

## Resident Registration Flow

1. Resident fills out the registration form.
2. Frontend calls `registerResident`.
3. Cloud Function validates payload and uniqueness.
4. Admin SDK creates the auth user.
5. Firestore account document is created.
6. Frontend signs the new user in and stores the local session.

## Routing Model

The app currently uses screen-state routing inside `App.tsx` instead of `react-router-dom` route definitions. That means:

- screen transitions are handled by React state
- role protection is handled by `RoleGuard`
- deep links are currently limited to query-param-based flows like password reset and direct registration entry

## Environment Behavior

### Local Vite Dev

- Uses direct Cloud Function URLs when not on emulators
- Uses emulator endpoints when `VITE_USE_FIREBASE_EMULATORS=true`

### Firebase Hosting

- Uses `/api/registerResident` through hosting rewrites
- Falls back to SPA `index.html` for client rendering
