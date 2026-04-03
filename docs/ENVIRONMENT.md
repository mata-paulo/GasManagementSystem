# Environment Variables

## Frontend Variables

The frontend reads standard `VITE_` variables.

Required:

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project id |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender id |
| `VITE_FIREBASE_APP_ID` | Firebase web app id |
| `VITE_MAPBOX_TOKEN` | Mapbox token for map views |

Recommended:

| Variable | Purpose | Default |
|---|---|---|
| `VITE_FIREBASE_FUNCTIONS_REGION` | Cloud Functions region | `asia-southeast1` |
| `VITE_USE_FIREBASE_EMULATORS` | Enables emulator connections in local dev | `false` |

Optional:

| Variable | Purpose |
|---|---|
| `VITE_REGISTER_RESIDENT_URL` | Explicit registration endpoint override |

## Backward Compatibility

The frontend also accepts some legacy variable names for compatibility:

- `VITE_PUBLIC_FIREBASE_API_KEY`
- `VITE_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `VITE_PUBLIC_FIREBASE_PROJECT_ID`
- `VITE_PUBLIC_FIREBASE_APP_ID`
- `VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `VITE_PUBLIC_FIREBASE_FUNCTIONS_REGION`
- `VITE_PUBLIC_USE_EMULATOR`
- `VITE_PUBLIC_REGISTER_RESIDENT_URL`

Preferred naming for this project is still the `VITE_*` form.

## Example

```env
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
VITE_FIREBASE_FUNCTIONS_REGION=asia-southeast1
VITE_USE_FIREBASE_EMULATORS=false
VITE_MAPBOX_TOKEN=your-mapbox-token
```

## Important Dev Detail

Vite only loads env variables at server startup. If you change `.env`, restart `npm run dev`.
