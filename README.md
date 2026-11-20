# Tangram Fit Plug

A tiny open-source app that reads health data on your phone and uploads it to **your** server. It is the companion plug for the Tangram Fit web app: it posts to the web app’s `POST /api/ingest` endpoint (format: `docs/ingest.md` in the web repository).

## Status

- **iOS (HealthKit):** reading is implemented.
- **Android (Health Connect):** not implemented yet.

## Use

1. On your own server, create a token (shown only once):

   ```bash
   node scripts/db.mjs ingest-token create --source healthkit
   ```

2. Install a **development build** on a physical phone. Expo Go cannot be used because HealthKit is a native module. Register the device, then build:

   ```bash
   npx eas device:create
   npx eas build --profile development --platform ios
   ```

3. Open the app, enter your server URL and token, grant health access, then tap sync.

## Develop

```bash
npm install
npm test
npm run typecheck
```

## Privacy

Read-only: the app does not write health data. Uploads go only to the server URL you enter. The token is stored in the system secure store.

## License

To be decided.
