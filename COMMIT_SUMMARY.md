# Resident Live Data + Registration Limit

## Summary

This update removes remaining static resident-side data and switches the resident experience to live Firebase-backed data for overview, transactions, stations, and account details. It also adds an environment-configurable resident registration limit enforced in the registration Cloud Function.

## Key Changes

- Replaced resident portal mock transactions and station data with live resident account, allocation summary, and station directory data.
- Updated the resident mobile dashboard to use live allocation totals, live recent transactions, and live station coordinates.
- Updated nearby stations to use only live station directory records and real published fuel prices.
- Removed fallback-generated fuel pricing and replaced it with empty states when stations have not published live prices yet.
- Added `subscribeResidentAccount()` and improved station directory enrichment so resident screens stay synced to current account and station data.
- Added `RESIDENT_REGISTRATION_LIMIT` support in the `registerResident` Cloud Function.
- Treated missing, empty, invalid, or `0` registration-limit values as unlimited.
- Added example env documentation for the new registration limit in root and functions env example files.

## Files Included

- `src/features/station/pages/ResidentWebPortal.tsx`
- `src/features/resident/pages/UserDashboard.tsx`
- `src/features/resident/pages/NearbyStations.tsx`
- `src/features/resident/pages/UserScanHistory.tsx`
- `src/lib/data/agas.ts`
- `functions/src/auth/registerResident.ts`
- `.env.example`
- `functions/.env.example`
- `functions/.gitignore`

## Verification

- `npm --prefix functions run build`

## Notes

- Root `npm run typecheck` still has unrelated pre-existing failures in `src/app/App.tsx`, `src/features/admin/pages/AdminDashboard.tsx`, and `src/features/station/pages/QRScanner.tsx`.
