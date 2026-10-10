# Scout Journey product brief

Scout Journey is a general-purpose place to note and reach personal objectives.
The core hierarchy is intentionally small: an objective contains milestones, and
each milestone contains concrete practices. The Task page aggregates those
practices for action, Objectives is the editable source of truth, and Journey is
a read-only record of completion dates.

Goal data stays local to the device. Export and import let people back up their data or move it between devices. On the original web origin, people can explicitly import their old app's browser data without deleting the original copy. See `web/src/domain/` for the data contracts.

## Research-informed direction

The product focuses on life objectives rather than daily task management: why
an objective matters, what milestones would indicate movement, which concrete
practices might help, and what the person learns by trying them. Practices,
reminders, and reviews should be optional and adaptable. An objective need not
have a deadline. Pausing or changing direction is a valid outcome.

The current persistence contracts still use the stable internal names
`Area → Stage → Goal` so existing local data and imports remain valid. The UI
translates these to `Objective → Milestone → Concrete task`; this is a product
language change, not a destructive migration.

See [RESEARCH.md](RESEARCH.md) for evidence, contradictory findings, source
links, and questions to test before changing the app's domain model.
