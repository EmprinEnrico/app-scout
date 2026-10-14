# Scout Journey — context for the next Codex chat

Updated 2026-10-14. This file is the handoff, not a replacement for
`AGENTS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, or `docs/RESEARCH.md`.
Read those files before making product or architecture changes.

## Product and decisions

- Scout Journey is a minimal, Apple-like journal for long-term life objectives,
  not a daily to-do list or calendar. No AI feature is currently included.
- Keep the navigation order: **Objectives** (initial page), **Journey**,
  **Settings**. Objectives is the editable source of truth; Journey is a
  read-only path and history view.
- An objective contains milestones; milestones contain free-text paragraphs and
  concrete tasks. In the editor, `#` starts a milestone and `-` starts a task.
  The marker stays visible while editing. Multiple ordinary text lines are valid.
  The editor should behave like a continuous text document, not a form with
  separate Save or Add Milestone controls.
- Do not use percentages, progress counters, streaks, or punitive scoring. The
  research favors adaptable practices and reflection over a fixed progress
  formula. See `docs/RESEARCH.md` for evidence and caveats.
- Journey shows a path through an objective's milestones and completed tasks.
  Opening an objective's history shows complete document versions in a
  carousel, with additions in green and removals in red. Draft keystrokes do
  not each create a history version; editing completion and task completion do.
- The app remains local-first. Data and history live in browser IndexedDB;
  Settings can export/import a JSON backup. A browser origin is not an account
  or cross-device sync. Users should export backups before changing origins.
- Native iOS/Android compatibility is via Capacitor. The notification layer is
  prepared, but remote push requires a backend and platform credentials.

## Implemented code map

- `web/src/components/ContinuousObjectiveEditor.tsx`: continuous editing UI.
- `web/src/domain/objectiveEditorModel.ts`: editor model and cursor behavior.
- `web/src/domain/objectiveMarkdown.ts`: Markdown file serialization/parser.
- `web/src/domain/goalsDb.ts`: Dexie/IndexedDB objective files, selection, and
  immutable history snapshots; `GoalsContext.tsx` sequences writes and exposes
  app mutations, backup, and restore.
- `web/src/components/JourneyScreen.tsx` and `web/src/JourneyPath.css`: journey
  path; `ObjectiveHistory.tsx`, `objectiveDiff.ts`, and related CSS: carousel
  and line diffs.
- `web/src/components/settings/DataPanel.tsx`: backup/import controls.
- `web/src/notifications/notifications.ts`: native notification boundary.
- `web/vite.config.ts`: PWA/service worker; `web/capacitor.config.ts`: native
  wrapper; `.openai/hosting.json`: existing private Sites identity.
- `web/src/domain/contracts.ts` still uses legacy internal names
  `Area → Stage → Goal`; UI language is `Objective → Milestone → Task`.
  Do not rename persisted fields casually or silently break existing backups.

## Hosting and the abandoned plugin experiment

- The normal product is the private Sites PWA at
  `https://app-scout.aglowhinny8.chatgpt.site`, not the HTML-only plugin.
  Preserve the existing project ID and owner-private access. A local build or
  a GitHub merge does **not** automatically publish a new Sites version.
- An HTML-only plugin bundle was tried. Its embedded browser context rejected
  IndexedDB with `SecurityError`, so it cannot be treated as durable app
  storage. The temporary in-memory fallback and plugin build tooling were
  removed. Do not reintroduce them as the normal product path.
- The last verified live Sites version before this handoff was version 38,
  sourced from commit `bdf6f45` (visual polish), deployed successfully.

## Development and verification

From `web/`: `npm ci` if dependencies are absent, then `npm run check` for
lint, unit tests, TypeScript, and a PWA build. `npm run dev` is local preview.
`npm run cap:sync` refreshes native projects after a web build. The automated
tests cover the editor model, Markdown, state, persistence, history/diff, and
notifications. They do not replace mobile touch/keyboard and browser QA.

Follow `AGENTS.md`: small focused files, practical 80–120-character lines,
purpose comments in source files, and tests next to logic. Preserve user data
and unrelated edits. Do not claim a publication or store-ready native build
without checking it.

## Agent provenance and next work

The owner asked Codex to supervise lower-cost agents during earlier development.
This repository does not retain a reliable agent/model roster or per-agent work
log, so this handoff does not attribute commits to particular subagents. Codex
reviewed and integrated the application work; Git history is the source of truth
for exact changes. This handoff was prepared by the current Codex assistant.

Potential next topics, **not** commitments: real-device editing/cursor QA,
reliable cross-device backup/sync, optional reminders and reflection UX, and
native store packaging/signing. Ask the owner before expanding the product.
