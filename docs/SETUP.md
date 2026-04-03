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
```

Use `VITE_REGISTER_RESIDENT_URL` only when you want to force resident registration to a custom endpoint.

## Run Frontend Only

```bash
npm run dev
```

Default Vite URL:

```text
http://localhost:5173
```

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
