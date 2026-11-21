# Tangram Fit Plug

[简体中文](./README.zh-CN.md)

A small open-source app that reads health data already on your phone and uploads it to **your** Tangram Fit server. Nothing is sent through a third party.

<!-- Screenshots to add when we have device captures of onboarding, pairing, sync, and settings. -->

## What it is / what it is not

**It is** an independent open-source companion. It reads Apple Health (HealthKit) on iPhone and Health Connect on Android, then `POST`s daily records to `https://<your-host>/api/ingest`. There is no account system and no vendor cloud: you pair a server URL and a token you created on that server.

**It is not** the paid Tangram Fit App, and it is not a subset of that product. The web app and this plug share an ingest contract; this repository is only the phone-side reader and uploader.

It does not write or change health records. It does not run in [Expo Go](https://docs.expo.dev/develop/development-builds/introduction/): HealthKit and Health Connect are native modules, so you need a development build.

## Features

- **Pairing.** Enter a server URL and token, or open a pairing link. The app calls `GET /api/ingest` with the bearer token before anything is saved, and rejects a token whose `source` does not match this phone (`healthkit` on iOS, `health-connect` on Android).
- **Manual sync** of recent days, plus a **90-day backfill**. Pull-to-refresh on the Sync tab also syncs.
- **Auto-sync** (on by default) when the app opens or returns to the foreground, if health access has been requested at least once and the last successful sync is older than one hour.
- **Result card:** days read, days the server accepted, rejected rows, fields the server ignored.
- **Errors** on the pairing and sync screens (invalid token, source mismatch, unreachable host, Health Connect missing, and so on).
- **Settings:** language, auto-sync, a read-only list of data types, privacy notes, version, GitHub link, unpair.
- **Light and dark** follow the system (`userInterfaceStyle: automatic`).
- **38 languages.** Every locale in `src/i18n/locales.ts` has a full catalog. Most strings other than English and Simplified Chinese are machine-assisted; native-speaker review is welcome.

## Data it reads

One local calendar day is one upload record. Sleep is attached to the **wake-up** date. HRV is not interchangeable across platforms: iOS sends SDNN, Android sends RMSSD, distinguished by `hrv_kind`.

| Data | iOS (HealthKit) | Android (Health Connect) | Upload field |
| --- | --- | --- | --- |
| Steps | `HKQuantityTypeIdentifierStepCount` | `Steps` | `steps` |
| Active energy | `HKQuantityTypeIdentifierActiveEnergyBurned` | `ActiveCaloriesBurned` | `kcal_active` |
| Total energy | Active + basal (`HKQuantityTypeIdentifierBasalEnergyBurned`) when both exist | `TotalCaloriesBurned` | `kcal_total` |
| Resting heart rate | `HKQuantityTypeIdentifierRestingHeartRate` | `RestingHeartRate` | `resting_hr` |
| HRV | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` → `hrv_kind: "sdnn"` | `HeartRateVariabilityRmssd` → `hrv_kind: "rmssd"` | `hrv`, `hrv_kind` |
| Weight | `HKQuantityTypeIdentifierBodyMass` | `Weight` | `weight_kg` |
| Body fat | `HKQuantityTypeIdentifierBodyFatPercentage` | `BodyFat` | `body_fat_pct` |
| Blood oxygen | `HKQuantityTypeIdentifierOxygenSaturation` | `OxygenSaturation` | `spo2` |
| Respiratory rate | `HKQuantityTypeIdentifierRespiratoryRate` | `RespiratoryRate` | `breathing` |
| VO₂ max | `HKQuantityTypeIdentifierVO2Max` | `Vo2Max` | `vo2max` |
| Wrist temperature | `HKQuantityTypeIdentifierAppleSleepingWristTemperature` | *not read* | `skin_temp` |
| Sleep | `HKCategoryTypeIdentifierSleepAnalysis` | `SleepSession` | `sleep` |
| Workouts | `HKWorkoutTypeIdentifier` | `ExerciseSession` | `exercise` |

Not read (examples): beat-to-beat heart rate, blood pressure, height, water, menstrual data. `exercise[].hr` exists in the TypeScript types but neither reader fills it.

Windows, de-duplication, sleep stages, workout mapping, and units: **[docs/data-mapping.md](./docs/data-mapping.md)**.

## Privacy & security

Read-only. Uploads go only to the URL you enter (HTTPS, except localhost-style hosts for debugging). The pairing token and related app state live in **expo-secure-store**: iOS Keychain, Android `SharedPreferences` encrypted with the Android Keystore. There is no analytics, advertising, or other third-party telemetry in this app.

Android Health Connect permissions declared in `app.json` (all `READ_*`): steps, active calories, total calories, resting heart rate, heart-rate variability, weight, body fat, oxygen saturation, respiratory rate, VO₂ max, sleep, exercise. iOS uses HealthKit share usage text in the HealthKit config plugin; the code requests **read** types only.

A pairing link includes the token in the query string. Do not post it in a public chat, issue, or screenshot. Treat it like a password.

Full details, including what unpair deletes: **[docs/privacy.md](./docs/privacy.md)**.

## Requirements

- A deployed Tangram Fit server whose `POST /api/ingest` and `GET /api/ingest` are reachable from the phone. If the site sits behind Cloudflare Access, add a **Bypass** for `/api/ingest`; the ingest token is the authenticator, and an Access login HTML page will break pairing and upload.
- A physical phone and a way to install a development build (Apple Developer Program for iOS; an Android device for Health Connect).
- **Node.js 22.13.x or later** (Expo SDK 58). This repo does not set `engines` in `package.json`; that minimum comes from the [SDK 58 table](https://docs.expo.dev/versions/v58.0.0/).
- Android **minSdk 26** (configured in `app.json`). iOS follows Expo SDK 58 (16.4+ in Expo’s table).

## Quick start

### 1. Create a token on your server

Run this in the **Tangram Fit server / web** repository, not in this repo. Use `healthkit` for iPhone and `health-connect` for Android. The token is shown once.

```bash
node scripts/db.mjs ingest-token create --source healthkit --label "iphone"
node scripts/db.mjs ingest-token create --source health-connect --label "pixel"
```

### 2. Clone this app and install

```bash
git clone https://github.com/whlan02/tangram-fit-plug.git
cd tangram-fit-plug
npm install
```

### 3. Change the bundle ID / application ID

`app.json` currently has `com.tangramfit.plug` for both iOS `bundleIdentifier` and Android `package`. Replace both with IDs you own before building. HealthKit and Play / Health Connect registration are tied to those IDs.

### 4. Log in to EAS and register devices

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest device:create   # iOS internal distribution
```

`eas init` is only needed if this checkout is not already linked to an EAS project.

### 5. Build a development client and install it

```bash
npx eas-cli@latest build --profile development --platform ios
npx eas-cli@latest build --profile development --platform android
```

Install the artifact on the phone (EAS install link, or `eas build:run` if you use it). **Expo Go will not work** here: `@kingstinct/react-native-healthkit` and `react-native-health-connect` are native modules that Expo Go does not ship.

### 6. Pair, grant access, sync

Open the app → short intro → server URL + token (or a pairing link) → **Test connection and save** → **Allow health data access** → **Sync now**.

### Local build without EAS

This project uses Continuous Native Generation (`ios/` and `android/` are not checked in). If you have Xcode or Android Studio:

```bash
npx expo run:ios
npx expo run:android
```

You still need a real device for HealthKit / Health Connect data. Simulators and the `reader.ts` web fallback cannot read health stores.

## Pairing link

Scheme: `tangramfitplug` (see `app.json`). Format:

```
tangramfitplug://pair?url=<urlencoded-https-origin>&token=<token>
```

Example (placeholder host and token):

```
tangramfitplug://pair?url=https%3A%2F%2Fyour-site.example&token=replace-me
```

Put the URL in a QR code, a note, or an AirDrop/message to yourself, then open it on the phone. The form is filled in; **nothing is stored until you tap Test connection and save**. Do not share the link publicly.

## Upload format

Full ingest documentation will ship with the Tangram Fit web app’s public repository. Until then, this is what the plug sends (see `src/ingest.ts` and `src/types.ts`).

**Check token** — `GET /api/ingest`  
Header: `Authorization: Bearer <token>`  
Expected JSON: `{ "source": "healthkit" | "health-connect", "label": "…" | null }`

**Upload** — `POST /api/ingest`  
Headers: `Content-Type: application/json`, `Authorization: Bearer <token>`  
Batches of at most 100 days. Re-sending the same days is intended: the server is expected to merge by `(date, source)`. Network errors, HTTP 429, and 5xx are retried a few times.

```json
{
  "version": 1,
  "source": "healthkit",
  "device": "ios 18.0",
  "records": [
    {
      "date": "2026-11-20",
      "steps": 8432,
      "kcal_active": 410,
      "kcal_total": 2100,
      "resting_hr": 58,
      "hrv": 42.1,
      "hrv_kind": "sdnn",
      "weight_kg": 70.2,
      "body_fat_pct": 18.5,
      "spo2": 97.2,
      "breathing": 14.1,
      "vo2max": 42.0,
      "skin_temp": 36.21,
      "sleep": {
        "minutes": 421,
        "deep": 80,
        "light": 240,
        "rem": 101,
        "awake": 25,
        "inbed": 460,
        "start": "23:12",
        "end": "06:52"
      },
      "exercise": [
        {
          "name": "Running",
          "type": "Running",
          "minutes": 32,
          "start": "07:10",
          "end": "07:42",
          "kcal": 280,
          "km": 5.12
        }
      ]
    }
  ]
}
```

`device` is `"${Platform.OS} ${Platform.Version}"`. Omit empty optional fields; the plug only includes keys that had data that day. On Android, `hrv_kind` is `"rmssd"` and `skin_temp` is never set.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Token invalid (401) | Create a new ingest token; old ones may be revoked. Pair again. |
| Source mismatch | iPhone needs `--source healthkit`; Android needs `health-connect`. The pairing screen blocks a mismatch. |
| Cannot reach the server | HTTPS URL, DNS, phone network. Plain HTTP is only allowed for localhost-style hosts. |
| Access login page / unparseable response | Cloudflare Access (or similar) is intercepting `/api/ingest`. Bypass that path; the token authenticates the request. |
| No data after sync | Grant every type you care about. On iOS, HealthKit does not tell the app which types were allowed — denied types simply come back empty. Watch data must already be on the phone. |
| No HRV or sleep stages on iOS | SDNN HRV and staged sleep often need an Apple Watch (or another writer in Health). Unspecified asleep is stored as light. |
| Health Connect missing | Install or update [Health Connect](https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata). The Sync tab offers a Play Store button when the error text mentions it. |
| Sync window feels short | First successful sync reads **30** local days. Later syncs read days since last success + 1, clamped to **3–90**. Use **Backfill last 90 days** for a full window. Auto-sync does not run until you have tapped health access once. |

## Project layout

```
App.tsx                 # Onboarding → pair → Sync / Settings tabs
src/health/             # reader.ios.ts, reader.android.ts, web fallback
src/ingest.ts           # URL rules, token check, batched POST
src/sync.ts             # Day-window + upload
src/autosync.ts         # One-hour foreground rule
src/pairing-link.ts     # tangramfitplug://pair
src/storage.ts          # SecureStore keys
src/sleep.ts            # Stage samples → per-wake-up summary
src/i18n/               # locales, catalogs, length rules
src/ui/                 # Screens and controls
src/state/              # Pairing, settings, sync hooks
test/                   # Node tests (no device HealthKit / Health Connect)
app.json                # Scheme, IDs, Android health permissions, plugins
eas.json                # development / preview / production profiles
docs/                   # Data mapping and privacy
```

## Development

```bash
npm install
npm test
npm run typecheck
npx expo start          # JS only; health APIs need a native build
```

### Languages

Catalogs live in `src/i18n/catalogs/`. To add a language: append `{ code, name }` in `src/i18n/locales.ts`, add a catalog with **every** English key (same `{placeholders}`), export it from `src/i18n/catalogs/index.ts`. `npm test` checks keys, placeholders, and length caps (`src/i18n/length-rules.ts`: tab labels ≤ 12, action-like keys ≤ 40, other strings bounded relative to English) so translations still fit the existing UI.

## Contributing

- **New data type:** add the field on `IngestRecord` (`src/types.ts`), read it in the iOS and/or Android reader, request the HealthKit type / Health Connect permission (`app.json` for Android), and add the settings label in every catalog. Do not invent server fields the ingest API does not accept.
- **New language:** see above; patches from native speakers are preferred over more machine translation.
- **Bugs and device results:** open an issue with OS version, watch/phone, which types were granted, and whether Health Connect is installed. Android reading is **not verified on a physical device**. iOS reading is implemented and covered by unit tests for sleep/sync/ingest, but **not widely verified on devices**.

## Status

Implemented in code:

- Pairing (form + link), token check, source check
- iOS HealthKit daily reads listed above
- Android Health Connect daily reads listed above (same fields except wrist temperature)
- Sync windows, 90-day backfill, auto-sync, result card, 38 locales, light/dark

Not claimed as device-tested:

- Android Health Connect on hardware (explicit in `reader.android.ts`)
- Broad iOS HealthKit coverage across watches and OS versions

Not in this app: background HealthKit delivery (`background: false` on the HealthKit plugin), Expo Go, writing to health stores, accounts, analytics.

## License

To be decided. Third-party packages keep their own licenses (see `package.json` / npm).

## Open questions

- This repository has no device-lab notes, so we cannot say iOS reading has been proven on a given Watch/OS pair.
- The ingest-token CLI (`scripts/db.mjs`) lives in the server project; flags such as `--label` are documented from the intended server workflow, not from files in this repo.
- Exact Cloudflare / reverse-proxy setup is server-side; only the symptom (HTML login instead of JSON) is visible to the plug.
- Health Connect stage integers `0` and `3` are not mapped in code; their official enum names are not commented here.
- Relationship to the paid Tangram Fit App beyond “independent app, not a subset” is product copy, not something this codebase encodes.
