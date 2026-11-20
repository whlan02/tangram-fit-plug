# Tangram Fit Plug

A small open-source app that reads health data on your phone and uploads it to **your** server. It is the companion plug for the Tangram Fit web app: it posts to the web app’s `POST /api/ingest` endpoint (format: `docs/ingest.md` in the web repository).

The app follows the web product’s pastel look, supports light and dark mode, and 38 languages (English and Simplified Chinese ship complete; others fall back to English until translated, or follow the system language). It never sends data through a third party.

## Status

- **iOS (HealthKit):** reading is implemented.
- **Android (Health Connect):** reading is implemented but not yet tested on a device.

## Use

1. On your own server, create a token (shown only once). Use `healthkit` on iPhone and `health-connect` on Android:

   ```bash
   node scripts/db.mjs ingest-token create --source healthkit
   ```

2. Install a **development build** on a physical phone. Expo Go cannot be used because HealthKit is a native module. Register the device, then build:

   ```bash
   npx eas device:create
   npx eas build --profile development --platform ios
   ```

3. Open the app, go through the short intro, enter your server URL and token (or open a pairing link), grant health access, then tap **Sync now**.

### Pairing links

The app accepts:

```
tangramfitplug://pair?url=<encoded-server-url>&token=<token>
```

The form is filled in for you. Nothing is saved until you tap **Test connection and save**, which checks the token against `GET /api/ingest` first.

### After pairing

- Sync tab: last sync time, results, **Sync now**, grant access, and a 90-day backfill. Pull to refresh. Auto-sync (on by default) runs when the app opens or returns to the foreground if the last sync is more than an hour ago.
- Settings: language, auto-sync, what is read (read-only), privacy notes, version, and unpair.

## Develop

```bash
npm install
npm test
npm run typecheck
```

## Privacy

Read-only: the app does not write health data. Uploads go only to the server URL you enter. The token is stored in the system secure store. There is no analytics, advertising, or third-party telemetry.

## License

To be decided.
