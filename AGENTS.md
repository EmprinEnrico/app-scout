# Scout Journey repository guide

Before continuing work from another chat, read `.codex/PROJECT_CONTEXT.md` for
the product decisions, implementation map, deployment state, and known limits.

## Project rules

Apply these rules to every authored source-code file in the repository:

- Aim for 100–300 lines per file. Refactor before a file reaches 600 lines; keep
  one class or focused module per file. Never allow an authored source file to
  exceed 1,000 lines.
- Keep lines between 80 and 120 characters where practical. Break long JSX,
  function calls, objects, arrays, and CSS declarations across lines instead of
  relying on horizontal scrolling.
- Begin every authored source file with a short comment explaining the file's
  role and purpose. Use the comment syntax native to that file type.
- Generated files, lockfiles, compiled output, binaries, images, and vendored
  platform files are excluded from line-count and header rules. Do not manually
  reformat generated native output.
- Run `npm run check` from `web/` after refactoring. Keep tests beside the
  modules they cover and update them when module boundaries change.

- The app lives in `web/` (React, Vite, TypeScript). Keep product UI and goal logic there; use `web/src/domain/contracts.ts` for shared contracts. The old Angular app remains available in Git history, not in the new source tree.
- From `web/`, run `npm ci`, `npm run dev`, `npm run test`, `npm run check`, and `npm run build`. The build writes to root `dist/`, matching `.openai/hosting.json`.
- PWA metadata and offline shell caching are configured in `web/vite.config.ts`; icon sources live in `web/public/`. Rebuild after changing either.
- `web/capacitor.config.ts` points to the same `dist/`. After a build, run `npx cap sync ios` or `npx cap sync android` from `web/` when native platforms exist; use platform tooling to run native apps.
- Keep the hosting project ID intact and preserve owner-only access when publishing. Do not merge this rebuild into the original GitHub main branch before the owner approves it.
