# Scout Journey architecture

`web/` is the React, TypeScript, and Vite app. `web/src/` owns screens and goal behavior; `web/src/domain/` contains versioned data contracts, validation, state transitions, and IndexedDB persistence through Dexie. `web/public/` holds static brand assets. `web/vite.config.ts` produces the installable PWA and writes the production site to root `dist/`, which the root hosting manifest serves.

The service worker precaches the built app shell so it can open offline. It activates new builds automatically; data persistence and offline mutations belong in app code. `web/capacitor.config.ts` packages the same build for iOS and Android with app ID `app.faro.mobile`.

From `web/`: `npm ci`, `npm run dev` for local work, `npm run check` before changes, `npm run build` for PWA or native assets, and `npm run cap:sync` after each web build to refresh the existing `web/ios/` and `web/android/` projects. The original mountain-road icon is preserved at `web/resources/icon.png`; native launcher icons and splash assets were generated from it, while `web/public/` contains resized PWA icons. Native compilation needs Xcode or Android Studio, and store signing is still required before submission. The private site is not published by these commands.

IndexedDB is per browser origin or native WebView. Data does not automatically sync between devices or installations; use the JSON export/import in Settings to transfer it. Existing browser data from the old web app can be imported explicitly on the same site origin. The prior native app used a different storage mechanism and is not automatically migrated by this browser import.

Each objective's current state is a Markdown file in IndexedDB. A separate
`objectiveVersions` table holds immutable Markdown snapshots. Draft changes save
to the current file as the user types; a snapshot is recorded when editing ends
or a task's completion changes. Existing files receive a baseline snapshot during
the IndexedDB v2 upgrade. Journey reads current task state to render the path;
the history carousel reads snapshots and computes visible line differences while
hiding private metadata. The JSON backup includes both current data and history.

## Notifications

`web/src/notifications/notifications.ts` is the native notification boundary. It requests push and local-notification permissions, registers APNs/FCM device tokens, receives push events, and schedules or cancels local reminders. The web build safely reports notifications as unsupported until a web push service is added. Remote push delivery still requires a backend that stores device tokens and sends through APNs/FCM; local reminders are ready to use from the app layer.
