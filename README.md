# Path Tracker

A local-first goals app built around goals, steps, and concrete tasks.

## Design

- Angular frontend
- Capacitor native app wrappers
- SQLite local storage for goals, steps, tasks, and progress

## Development

Install dependencies from `app-frontend`:

```bash
npm install
```

The SQLite overhaul also needs:

```bash
npm install @capacitor-community/sqlite jeep-sqlite
```

Build and sync native projects:

```bash
npm run build
npx cap sync
```
