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
- `data/agas.ts`: shared Firestore data mapping for admin dashboard records
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

Admin-specific note:

- `role: "admin"` routes the user into the admin dashboard in `App.tsx`
- admin users use the same login form as other roles
- admin accounts are provisioned outside the public UI through the Functions script

## Resident Registration Flow

1. Resident fills out the registration form.
2. Frontend calls `registerResident`.
3. Cloud Function validates payload and uniqueness.
4. Admin SDK creates the auth user.
5. Firestore account document is created with resident profile fields plus fuel tracking defaults such as `fuelAllocation: 20` and `fuelUsed: 0`.
6. Frontend signs the new user in and stores the local session.

## Firestore Data Model

### `accounts/{uid}`

Resident documents include the profile and fuel-allocation state used by both resident and station flows.

- `role`
- `firstName`
- `lastName`
- `plate`
- `barangay`
- `vehicleType`
- `gasType`
- `fuelAllocation`
- `fuelUsed`
- `fuelWeekKey`
- `registeredAt`
- `updatedAt`

Station documents include assignment, presence, and fuel-management fields.

- `role`
- `brand`
- `barangay`
- `stationDirectoryId`
- `stationSourceId`
- `stationCode`
- `stationName`
- `availableFuels`
- `fuelCapacities`
- `fuelInventory`
- `fuelPrices`
- `assignmentStatus`
- `presenceStatus`
- `lastSeenAt`

### `transactions/{transactionId}`

Transactions are the durable fuel-dispense records shared by resident, station, and admin views.

- `residentUid`
- `stationUid`
- `stationId`
- `residentName`
- `stationName`
- `plate`
- `vehicleType`
- `fuelType`
- `liters`
- `pricePerLiter`
- `amount`
- `occurredAt`
- `weekKey`
- `status`

## Admin Provisioning Flow

1. A developer or operator runs the Functions script `admin:provision`.
2. The script creates the Firebase Auth user if needed.
3. The script writes or updates the Firestore `accounts/{uid}` document with `role: "admin"`.
4. The admin signs in through the standard frontend login screen.
5. `App.tsx` sends the authenticated admin into the admin portal.

## Admin Dashboard Data Flow

1. The admin dashboard loads `accounts` and `transactions` from Firestore through `src/lib/data/agas.ts`.
2. Resident, station, and transaction records are normalized into dashboard-ready shapes.
3. Station invite records are loaded from `stationInvites` so pending assignments and invite delivery status can be shown in the admin UI.
4. The existing dashboard UI derives analytics, heatmap markers, allocation summaries, users, and transaction views from those live records.
5. Static location metadata is still used only to place known station brands on the map when Firestore records do not yet store coordinates.

## Resident Allocation Model

Resident allocation is week-aware and uses Monday as the start of the week.

1. `src/lib/data/agas.ts` derives a `weekKey` for the current week.
2. Resident `fuelUsed` applies only when `fuelWeekKey` matches the current week.
3. If the stored `fuelWeekKey` is from a past week, the app treats current-week usage as `0`.
4. Resident dashboard remaining liters are computed on the frontend as `fuelAllocation - usedLiters`.
5. During station dispensing, the station flow updates both `fuelUsed` and `fuelWeekKey` on the resident account, then writes a matching transaction record with the same week key.

This gives the app an automatic weekly reset without needing a scheduled batch job.

## QR Validation Flow

Station validation now uses a UID-based QR payload.

1. Resident QR generation encodes the resident Firebase Auth UID.
2. Station scan decodes the UID.
3. The app fetches `accounts/{uid}` from Firestore.
4. Verified resident details shown to the station are taken from the live resident account.
5. Dispense validation uses the fetched resident account, current-week quota state, and station inventory before writing the transaction.

## Station Invite Flow

1. Admin opens a station drawer and submits the invite form.
2. Frontend calls `assignStationUser`.
3. Cloud Function creates or updates the Firebase Auth user.
4. Cloud Function batch-writes the station account assignment and the Firestore `stationInvites/{uid}` record first.
5. Cloud Function generates a secure password-reset invite link.
6. Cloud Function sends the custom HTML invite email through SMTP.
7. The function stores the email delivery result in Firestore so the admin UI can show `queued`, `sent`, or `failed`.

Key design choice:

- the pending invite record is written before email sending, so admin state stays durable even when email delivery fails

## Station Presence Model

Station presence is tracked from the frontend for authenticated station users.

1. When a station user session is active, `AuthContext.tsx` writes `presenceStatus: "online"` and refreshes `lastSeenAt`.
2. On logout, the same account is marked `presenceStatus: "offline"`.
3. Admin dashboard station and user status views use presence plus assignment state instead of the older generic station status field.

Admin dashboard rules:

- invited but not yet accepted users are `Offline`
- assigned users with no recent presence heartbeat are `Offline`
- a station is `Online` only when at least one assigned station user is currently online
- a station with no assigned users is always `Offline`

## Routing Model

The app still uses state-driven rendering inside `App.tsx` instead of `react-router-dom` route definitions for the major role portals, but the admin dashboard sidebar now uses URL-backed section paths.

That means:

- role-level portal switching is still handled by React state plus `RoleGuard`
- admin sidebar sections use `/admin/<section>` paths and survive refresh
- browser back/forward works across admin sections
- deep links still include query-param-based flows like password reset and direct registration entry

## Environment Behavior

### Local Vite Dev

- Uses emulator endpoints when `VITE_USE_FIREBASE_EMULATORS=true`
- Uses `/api/*` Vite proxying to the Cloud Functions origin for admin invite HTTP calls
- Resident registration still uses direct function URLs when not on emulators

### Firebase Hosting

- Uses `/api/registerResident` through hosting rewrites
- Uses `/api/assignStationUser` through hosting rewrites
- Falls back to SPA `index.html` for client rendering
