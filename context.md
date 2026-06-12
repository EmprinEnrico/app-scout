# Project Context

This file stores durable project knowledge for future Codex sessions and for manual editing by the project owner.

## Current Direction

- Working app name: Path Tracker.
- The app is being overhauled from a scout-specific objectives tracker into a general-purpose local-first goals app.
- Core hierarchy: Goal > Step > Task.
- Journey is the editable current-goal workspace.
- Archive is a read-only progress and history summary.
- Old local scout-specific data can be discarded; no migration is required.
- Current baseline after the initial overhaul: the browser app loads, Journey is usable, Archive loads, and the project builds through the user-run `build.sh` workflow.

## Product Model

- A goal is the main thing the user wants to reach.
- A goal is made of steps.
- A step represents an aspect or phase of a goal.
- A task is a concrete action inside a step.
- Tasks can have long body text because a task may be a complex todo.
- Tasks support completion state and optional due date.
- Completed tasks stay visible.
- Step and goal progress are computed from tasks, but status overrides are allowed.

## Current Technical Shape

- Repository root: `/mnt/c/Users/e.emprin/Documents/GITHUB_personale/app-scout`.
- Main app: `app-frontend`, Angular 21 with Capacitor Android/iOS wrappers.
- Static promo/docs page: `docs`.
- SQLite is the intended native source of truth via `@capacitor-community/sqlite`.
- Browser development currently uses a Preferences-backed local store because `jeep-sqlite` does not open its web store reliably in the current `ng serve`/Electron browser setup.
- Capacitor Preferences stores the selected goal and the browser development goal/step/task store.
- The browser fallback is intentionally temporary but should remain until a SQLite web-store replacement/fix is planned and tested.

## Important Files

- `fix_backlog.md`: read this first before making app changes. The user may edit it before or while Codex works.
- `app-frontend/src/app/services/datahandler.service.ts`: current repository/service entry point for goals, steps, tasks, native SQLite initialization, browser Preferences fallback, and selected-goal persistence.
- `app-frontend/src/app/journey`: still misspelled at file/folder/class level, but now implements the Journey UI.
- `app-frontend/src/app/archive`: read-only archive summary UI.
- `app-frontend/src/app/settings`: generic app/settings copy.
- `app-frontend/src/main.ts`: defines the `jeep-sqlite` custom elements for web fallback.
- `app-frontend/angular.json`: copies `sql-wasm.wasm` into app assets for SQLite web fallback.
- `app-frontend/src/app/app.config.ts`: Angular app providers; database initialization is handled by routed pages through `DatahandlerService`.
- `app-frontend/build.sh`: user-run Windows npm build wrapper. Writes `app-frontend/build-log.txt`.
- `app-frontend/log.sh`: user-run browser logging server wrapper. Writes `app-frontend/browser-log.txt`.
- `app-frontend/src/app/services/browser-log.service.ts`: browser-side runtime logger used by Journey/Archive and startup error handlers.
- `plan.md`: implementation checklist and product decisions.

## Current Implementation Notes

- The old `/journey` route is still kept as a compatibility alias.
- The default route now points to `/journey`.
- The old `/dummy` refresh route is no longer part of active routing.
- The old dummy component has been removed.
- Native SQLite setup is guarded and should happen once before Journey or Archive use the database.
- Browser mode intentionally bypasses SQLite and uses the local Preferences store so the app remains usable from `ng serve`.
- Full CRUD is expected for goals, steps, and tasks.
- A starter goal should be created automatically on first launch.
- Journey currently logs load/save/create/delete events to the browser log server when it is running.
- Archive currently logs load success/failure to the browser log server when it is running.
- Visible scout-specific UI copy/logos were removed from the main app surface; old native identifiers/generated project paths may still need a final naming pass.
- Native app identifiers and generated platform files still need a final naming pass later.

## Known Constraints

- Codex runs in WSL, but the project build uses Windows Node/npm.
- Build verification is user-run from `app-frontend` with `./build.sh`.
- Do not try to run `./build.sh` from Codex; ask the user to run it, then inspect `app-frontend/build-log.txt`.
- After asking the user to run `./build.sh`, Codex should inspect `app-frontend/build-log.txt` and continue from that output.
- Browser runtime logging is user-run from `app-frontend` with `./log.sh`.
- Do not try to run `./log.sh` from Codex; ask the user to run it or refresh the app, then inspect `app-frontend/browser-log.txt`.
- After asking the user to run or refresh the app with `./log.sh` active, Codex should inspect `app-frontend/browser-log.txt`.
- In the previous session, `./build.sh` passed with exit code 0 using Windows Node/npm. Node warned that v25.8.1 is not LTS.
- The user plans to commit the current overhaul as the first branch commit before starting the next work session.
- Always ask the user before installing new packages.
- Never edit `package.json` or any lockfile directly without asking the user first.
- The user may edit files while Codex is working. Treat unexpected changes as user/other-agent changes, do not revert them, and keep working around them.

## New Chat Startup Checklist

- Read `context.md`, `plan.md`, and `fix_backlog.md`.
- Check `git status --short` to understand the current worktree after the user's commit.
- If changing app behavior, keep `ng serve` and `./log.sh` workflow in mind and inspect `browser-log.txt` after user interaction.
- Before finishing build-sensitive work, ask the user to run `./build.sh` from `app-frontend`, then inspect `build-log.txt`.
- Do not install packages or edit package/lock files without explicit permission.

## Open Decisions

- Final app name.
- Final native package identifiers.
- Whether to rename the `journey` folder/component/class or leave compatibility aliases.
- Whether to add language selection in settings.
- Whether task ordering should be drag-and-drop or simple append-only for v1.
- Whether archive should eventually support filters/search.
