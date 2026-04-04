# Setup

## Prerequisites

- Node.js 20+ recommended
- npm
- Firebase CLI

## Install Dependencies

```bash
npm install
npm --prefix functions install
```

## Frontend Environment

Create a `.env` file in the project root.

Required values:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_FUNCTIONS_REGION=asia-southeast1
VITE_USE_FIREBASE_EMULATORS=false
VITE_MAPBOX_TOKEN=
```

Optional override:

```env
VITE_REGISTER_RESIDENT_URL=
VITE_DEV_API_PROXY_TARGET=
```

Use `VITE_REGISTER_RESIDENT_URL` only when you want to force resident registration to a custom endpoint.
Use `VITE_DEV_API_PROXY_TARGET` only when you want Vite `/api/*` calls to proxy to a different Functions origin during local development.

## Create the First Admin Account

Admin accounts are not created through the public frontend registration flow.

Use the Functions-side provisioning script instead:

```bash
npm --prefix functions run admin:provision -- --email admin@example.com --password your-password --first-name Admin --last-name User
```

What it does:

- creates the Firebase Auth user if it does not exist yet
- updates the existing Firebase Auth display name when the user already exists
- writes or updates the Firestore `accounts/{uid}` document with `role: "admin"`

After provisioning, sign in through the normal frontend login form with the admin email and password.

## Seed the Station Directory

To write the current resident-map `STATIC_STATIONS` catalog into Firestore, run:

```bash
npm run seed:stations
```

What it does:

- reads the `STATIC_STATIONS` array from `src/features/resident/pages/NearbyStations.tsx`
- reads `DEFAULT_BRAND_PRICES`, `BRAND_COLORS`, and matching admin `STATIC_STATIONS` metadata from `src/features/admin/pages/AdminDashboard.tsx`
- writes each station into the Firestore `stationDirectory` collection
- keeps stable document IDs based on the original numeric `id`
- stores `name`, `brand`, `address`, `rating`, `hours`, `lat`, `lon`, `location`, `brandPrices`, `brandColors`, and matching mock fields like `barangay`, `officer`, `capacity`, `dispensed`, and `status`

If you are targeting emulators, start them first and make sure the Firestore emulator environment variables are active for the Functions process.

## Run Frontend Only

```bash
npm run dev
```

Default Vite URL:

```text
http://localhost:5173
```

Local admin and registration HTTP calls:

- `registerResident` uses the emulator URL when emulators are enabled
- `assignStationUser` uses `/api/assignStationUser` in local dev, and Vite proxies that request to the Cloud Functions origin
- if you change Vite proxy-related env vars, restart `npm run dev`

## Run Firebase Emulators

```bash
npm run emulators
```

Configured emulator ports:

- Auth: `9099`
- Functions: `5001`
- Firestore: `8080`
- Emulator UI: `4000`

If you want the frontend to talk to emulators, set:

```env
VITE_USE_FIREBASE_EMULATORS=true
```

Then restart the Vite dev server.

## Production Build

```bash
npm run build
```

## Verification

```bash
npm run typecheck
npm run build
```

## Deployment Shape

- Frontend is built into `dist/`
- Firebase Hosting serves the SPA
- Hosting rewrites `/api/registerResident` to the backend function in production
- Admin provisioning is intentionally kept out of Hosting routes and public UI
- Firestore Rules should be deployed together with frontend and Functions changes when resident fuel allocation logic changes

## Station Invite Email Setup

Station-role invites are stored in Firestore first, then the backend sends a custom HTML email. This means pending invites still appear in the admin UI even if email delivery fails.

Configure these Functions runtime environment variables before deploying invite email changes:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM_EMAIL=no-reply@example.com
SMTP_FROM_NAME=AGAS
APP_BASE_URL=https://agas-fuel-rationing-system.web.app
```

Make sure the same values are available to the deployed Functions runtime, not just the frontend `.env`.

## Admin Navigation and Presence

The admin sidebar uses URL-backed sections instead of in-memory tab state.

Examples:

- `/admin/overview`
- `/admin/stations`
- `/admin/transactions`
- `/admin/users`

This keeps the selected admin section on refresh and supports browser back/forward navigation.

Station online/offline state in the admin dashboard is presence-based:

- no assigned station users: station is `Offline`
- assigned station users but none currently active: station is `Offline`
- at least one assigned station user currently active: station is `Online`

Pending invited users do not count as online until they accept the invite and sign in.

## Weekly Fuel Quota Behavior

- Resident quota defaults to `20L` per week.
- Resident `fuelUsed` is tracked against `fuelWeekKey`.
- The app treats resident usage as reset when `fuelWeekKey` is from an older week.
- No cron or scheduled reset job is required for the weekly resident quota.
- Station dispense updates resident `fuelUsed`, resident `fuelWeekKey`, station inventory, and the `transactions` collection in one flow.

## Data Collections Used By Resident And Station Portals

### `accounts`

- Resident records include profile fields, `fuelAllocation`, `fuelUsed`, and `fuelWeekKey`.
- Station records include station assignment, online presence, fuel inventory, capacities, and prices.

### `transactions`

- Each transaction stores the resident plate, station branch reference via `stationId`, liters dispensed, peso amount, and the transaction timestamp.
- Resident users only see their own transactions.
- Station users only see transactions recorded by their own station account.
