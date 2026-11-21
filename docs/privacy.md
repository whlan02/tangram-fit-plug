# Privacy

What Tangram Fit Plug reads, where it sends data, where it stores data, and what unpair clears. Source of truth: `src/health/*`, `src/ingest.ts`, `src/storage.ts`, `src/state/usePairing.ts`, `app.json`.

English overview: [README.md](../README.md). 中文概述：[README.zh-CN.md](../README.zh-CN.md).

## What it reads

The app requests **read** access only.

**iOS** (`reader.ios.ts`): `requestAuthorization({ toRead: [quantity types, SleepAnalysis, HKWorkoutTypeIdentifier] })`. HealthKit does not report which types the user allowed; denied types return empty. The HealthKit config plugin sets `NSHealthShareUsageDescription` (read) and `NSHealthUpdateUsageDescription` (the text says the app does not write). `background` is `false`.

**Android** (`reader.android.ts` + `app.json`): `requestPermission` with `accessType: "read"` for:

| Permission in `app.json` | Used for |
| --- | --- |
| `android.permission.health.READ_STEPS` | steps |
| `android.permission.health.READ_ACTIVE_CALORIES_BURNED` | `kcal_active` |
| `android.permission.health.READ_TOTAL_CALORIES_BURNED` | `kcal_total` |
| `android.permission.health.READ_RESTING_HEART_RATE` | `resting_hr` |
| `android.permission.health.READ_HEART_RATE_VARIABILITY` | HRV (RMSSD) |
| `android.permission.health.READ_WEIGHT` | `weight_kg` |
| `android.permission.health.READ_BODY_FAT` | `body_fat_pct` |
| `android.permission.health.READ_OXYGEN_SATURATION` | `spo2` |
| `android.permission.health.READ_RESPIRATORY_RATE` | `breathing` |
| `android.permission.health.READ_VO2_MAX` | `vo2max` |
| `android.permission.health.READ_SLEEP` | sleep |
| `android.permission.health.READ_EXERCISE` | workouts |

Wrist temperature is iOS-only. Field-level mapping: [data-mapping.md](./data-mapping.md).

The app does not write samples, workouts, or sleep back to HealthKit or Health Connect.

## Where it sends data

Only to the origin you pair (`normalizeServerUrl` in `src/ingest.ts`):

- Scheme must be `https:`, except `http:` for `localhost`, `127.0.0.1`, `[::1]`, `*.local`, `*.localhost`.
- Paths on the URL you type are stripped; the app always calls `{origin}/api/ingest`.
- **GET** `/api/ingest` with `Authorization: Bearer <token>` before pairing is saved.
- **POST** `/api/ingest` with JSON `{ version: 1, source, device, records }` and the same bearer header.

There is no analytics SDK, ad SDK, or crash reporter in `package.json`. Settings copy (`settings.privacyBody`) matches this: data goes only to the server you enter.

The pairing link `tangramfitplug://pair?url=…&token=…` carries the token in the query string. Anyone who can read that URL can upload as you until you revoke the token. Do not put it in a public issue, chat, or screenshot.

## Where it is stored on the phone

All of the following use `expo-secure-store` (`src/storage.ts`). Per Expo SDK 58 docs: iOS stores values in the **Keychain** (`kSecClassGenericPassword`); Android stores them in **SharedPreferences encrypted with the Android Keystore**.

| Key | Contents |
| --- | --- |
| `pairing` | JSON `{ serverUrl, token }` |
| `last_sync` | ISO timestamp of last successful upload |
| `last_result` | JSON summary (days, records, accepted, rejected, ignored_fields) |
| `locale_pref` | `"auto"` or a locale code (`"zh"` is migrated to `"zh-Hans"`) |
| `onboarded` | `"1"` after the intro |
| `auto_sync` | `"0"` = off; missing key means **on** |
| `health_access_asked` | `"1"` after the user has tapped grant access |

Health samples are **not** persisted as a local database. They are read for the sync window and posted; only the last result summary is kept.

On iOS, Keychain items can survive uninstall if the app is reinstalled with the same bundle ID (Expo SecureStore behavior). On Android, SecureStore data is not preserved after uninstall.

## What unpair clears

`unpair` in `src/state/usePairing.ts` calls `clearPairing()` then `clearLastResult()`:

| Cleared | Not cleared |
| --- | --- |
| `pairing` (URL + token) | `locale_pref` |
| `last_sync` | `onboarded` (you return to the pair form, not the three-point intro) |
| `last_result` | `auto_sync` |
| | `health_access_asked` |

Health authorization itself is owned by the OS (Health / Health Connect). Unpair does not revoke those OS permissions; use system Settings if you want to withdraw them.

Unpairing does not delete data already accepted by your server. Revoke or delete the ingest token on the server if the phone should no longer be able to upload.

## What the OS still holds

Apple Health and Health Connect keep their own stores. This app never asked to write them, and unpair does not erase Watch or Health Connect history.
