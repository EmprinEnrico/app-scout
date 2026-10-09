# Faro repository guide

- The app lives in `web/` (React, Vite, TypeScript). Keep product UI and goal logic there; use `web/src/domain/contracts.ts` for shared contracts. The old Angular app remains available in Git history, not in the new source tree.
- From `web/`, run `npm ci`, `npm run dev`, `npm run test`, `npm run check`, and `npm run build`. The build writes to root `dist/`, matching `.openai/hosting.json`.
- PWA metadata and offline shell caching are configured in `web/vite.config.ts`; icon sources live in `web/public/`. Rebuild after changing either.
- `web/capacitor.config.ts` points to the same `dist/`. After a build, run `npx cap sync ios` or `npx cap sync android` from `web/` when native platforms exist; use platform tooling to run native apps.
- Keep the hosting project ID intact and preserve owner-only access when publishing. Do not merge this rebuild into the original GitHub main branch before the owner approves it.
