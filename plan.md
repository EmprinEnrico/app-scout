# App Overhaul Plan

This file tracks the current overhaul from the old scout-specific app into Path Tracker.

## Goal

Build a complete local-first app for structured personal progress. The app should help users define goals, break them into steps, and track concrete tasks inside those steps.

## Decisions

- Core hierarchy: Goal > Step > Task.
- Journey shows the currently selected goal and is fully editable.
- Archive summarizes all goals in read-only form.
- Storage should use SQLite through `@capacitor-community/sqlite` on native platforms.
- Browser development currently uses a Preferences-backed local store because `jeep-sqlite` fails to open its web store in the current development browser.
- Old Preferences-based scout data can be ignored/reset.
- Tasks support long body text, completion state, and optional due date.
- Goals and steps support manual status overrides on top of computed progress.
- `fix_backlog.md` is the working intake file for user-requested fixes and UX notes. Read it before starting changes and re-check it during longer work.
- Ask before installing packages or editing `package.json`/lockfiles.

## Implemented In This Overhaul

- Replaced the old scout-specific data service with a SQLite-backed goal/step/task repository.
- Added a browser Preferences-backed local store fallback so `ng serve` is usable now while native SQLite remains the intended native storage path.
- Rebuilt Journey around horizontal goal chips, one selected goal, editable steps, long task text, task completion, and optional due dates.
- Rebuilt Archive as a read-only progress summary with completed/open/overdue/scheduled counts.
- Removed active use of the dummy refresh route.
- Removed the stale dummy component files.
- Added `/journey` while keeping `/journey` as a compatibility alias.
- Removed visible scout-specific copy from README, docs, settings, Journey, and Archive.
- Added web SQLite custom element setup in `main.ts`.
- Added the SQLite web wasm asset configuration in `angular.json`.
- Guarded SQLite web-store initialization in the repository service for future native/web revisit.
- Changed Journey saves to preserve local text instead of reloading the whole goal after every blur.
- Added `build.sh` and `log.sh` handoff scripts in `app-frontend`.
- Added browser runtime logging for startup, Journey, and Archive.
- Added `context.md`, `plan.md`, and `fix_backlog.md` as durable project coordination files.

## Current Baseline

- Browser Journey loads through the Preferences-backed local store.
- Browser Archive loads and summarizes stored goals.
- Live browser logs showed successful goal/step/task saves, task creation/deletion, task completion, Journey reloads, and Archive loads.
- User-run `./build.sh` completed successfully with exit code 0.
- Build warning: Windows Node v25.8.1 is non-LTS.
- User intends to push/commit this overhaul as the first branch commit before the next clean chat.

## Remaining Work

- Read `fix_backlog.md` before each new implementation pass.
- Keep using the user-run `./build.sh` and `./log.sh` workflows for verification.
- Add/update focused tests around the repository behavior and UI flows.
- Verify native SQLite path separately on Android/iOS after the browser UX settles.
- Sync native projects with `npx cap sync` when native config/package work is intentionally being handled.
- Decide final app name and native package identifiers.
- Rename `journey` folder/component/class if desired.
- Add a proper settings screen for language, export, and storage maintenance later.
- Consider drag-and-drop ordering for goals, steps, and tasks.
- Decide whether to keep the browser Preferences fallback, repair `jeep-sqlite`, or replace web storage with another browser-safe persistence layer.

## Fixed Browser Issues

- First load no longer fails on `WebStore is not open yet` in the browser path.
- Journey now reaches a loaded state through the browser Preferences-backed store.
- Goal, step, task save/create/delete/completion events were verified through the live browser log.
- Archive loads from the same stored data and logs successful loads.

## Acceptance Criteria

- First launch creates one editable starter goal.
- Users can create, edit, and delete goals, steps, and tasks in the browser workflow.
- Tasks can store long text, done state, and optional due date.
- Completed tasks remain visible.
- Journey focuses on one current goal at a time.
- Archive is read-only and summarizes all goals.
- No visible scout-specific wording, logos, or links remain in the main app UI.
- `app-frontend/build-log.txt` shows a successful build after the user runs `./build.sh`.
