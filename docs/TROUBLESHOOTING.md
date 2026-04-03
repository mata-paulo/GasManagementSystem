# Troubleshooting

## `auth/invalid-api-key`

Cause:

- missing Firebase env values
- wrong variable names
- Vite dev server started before `.env` was updated

Checks:

1. Confirm `.env` contains `VITE_FIREBASE_API_KEY`
2. Confirm the other Firebase values are present
3. Restart the Vite dev server
4. Hard refresh the browser

## `POST /api/registerResident 404` during local dev

Cause:

- `http://localhost:5173` is Vite, not Firebase Hosting
- hosting rewrites are not applied there

Expected behavior:

- if emulators are enabled, the app uses the local Functions emulator
- if emulators are disabled, the app uses the deployed Cloud Function directly

Checks:

1. Confirm `VITE_FIREBASE_PROJECT_ID` is set
2. Confirm `VITE_FIREBASE_FUNCTIONS_REGION` matches the deployed function region
3. Restart the dev server after changing `.env`

## Emulator Calls Not Working

Checks:

1. Set `VITE_USE_FIREBASE_EMULATORS=true`
2. Start emulators with `npm run emulators`
3. Confirm ports match `firebase.json`
4. Restart Vite after enabling emulator flags

## Registration Fails Even Though URL Is Correct

Possible causes:

- deployed function is not available
- CORS issue
- backend validation error
- duplicate email or duplicate plate

Checks:

1. Open browser devtools and inspect the network response body
2. Check Firebase Functions logs or emulator terminal output
3. Verify `functions/src/auth/registerResident.ts`

## Build Succeeds But Bundle Warning Appears

Current behavior:

- Vite warns that the main JS bundle is larger than `500 kB`

This is a warning, not a build failure.

Potential future improvements:

- route-based code splitting
- lazy-load heavy admin or map screens
- split large screen modules by feature
