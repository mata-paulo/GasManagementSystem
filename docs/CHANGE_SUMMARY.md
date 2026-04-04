# Change Summary

## Overview

This project was updated so the resident and station portals use live Firestore data instead of mock data. The resident flow, station flow, QR validation flow, and transaction history now read and write real records from Firebase.

## Main Changes

### Live Firestore Data

- Resident and station screens now use live `accounts`, `transactions`, and `stationDirectory` records.
- Resident dashboards and station dashboards no longer depend on mock transaction lists for core behavior.
- Station dispense now creates real transaction records and updates real station inventory.

### Accounts Collection

Resident account documents in `accounts/{uid}` now support:

- `fuelAllocation`
- `fuelUsed`
- `fuelWeekKey`
- `plate`
- `vehicleType`
- `gasType`
- resident profile fields like `firstName`, `lastName`, and `barangay`

Current resident fuel behavior:

- default allocation is `20L`
- new resident accounts start with `fuelUsed: 0`
- if a resident document is missing fuel values, the frontend falls back safely

### Transactions Collection

The `transactions` collection is now the source of truth for fuel dispense history.

Each transaction stores fields such as:

- `residentUid`
- `stationUid`
- `stationId`
- `plate`
- `fuelType`
- `liters`
- `pricePerLiter`
- `amount`
- `occurredAt`
- `weekKey`
- `status`

Visibility rules:

- residents can only see their own transactions
- station users can only see transactions recorded by their own station account
- admins can view all transactions

### QR Code Flow

Resident QR generation now uses the resident Firebase Auth user ID.

Flow:

1. Resident opens their QR code.
2. The QR encodes the resident UID.
3. Station scans the QR.
4. The app fetches `accounts/{uid}` from Firestore.
5. Verified resident data shown on the station side comes from the live resident record.

This avoids mismatched name, plate number, and allocation data during scanning.

### Weekly Quota Reset

Resident quota is now week-aware.

- weekly limit is `20L`
- resident usage is tracked with `fuelUsed`
- the week it belongs to is tracked with `fuelWeekKey`
- when a new week starts, the app treats old usage as expired and the resident effectively gets a fresh weekly quota

This reset is logical and automatic. It does not require a scheduled cron job or manual admin reset.

### Station Dispense Flow

When a station confirms a dispense:

1. the station user is validated
2. the resident account is fetched from Firestore
3. the resident weekly remaining liters are checked
4. the station inventory is checked
5. a real `transactions` document is created
6. station inventory is updated
7. resident `fuelUsed` and `fuelWeekKey` are updated

## Files Updated

Key implementation files:

- `src/lib/data/agas.ts`
- `src/lib/auth/authService.ts`
- `src/lib/qr/qrCodec.ts`
- `src/features/resident/pages/QRDisplay.tsx`
- `src/features/resident/pages/UserDashboard.tsx`
- `src/features/resident/pages/UserScanHistory.tsx`
- `src/features/resident/pages/NearbyStations.tsx`
- `src/features/station/pages/Dashboard.tsx`
- `src/features/station/pages/QRScanner.tsx`
- `src/features/station/pages/ValidationSuccess.tsx`
- `src/features/station/pages/ScanHistory.tsx`
- `functions/src/auth/registerResident.ts`
- `firestore.rules`

Documentation files updated:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/SETUP.md`

## Deployment Notes

To make these changes live in production, deploy:

- frontend hosting
- Cloud Functions
- Firestore Rules

These should be deployed together because resident registration, QR validation, dispense writes, and resident fuel usage permissions depend on matching backend and frontend behavior.
