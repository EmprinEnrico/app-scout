# Scout Journey product brief

Scout Journey is a general-purpose place to note and reach personal objectives.
The core hierarchy is intentionally small: an objective contains milestones, and
each milestone contains concrete practices. Objectives remains the initial page
and editable source of truth. Journey is a read-only path through the milestones
and their tasks, without percentages, streaks, or scores.

Opening an objective from Journey shows its history as a carousel of complete
document versions. Each version compares with its predecessor: removed lines are
red, added lines green, and task completion is visible on the snapshot. Editing
is grouped into meaningful versions instead of recording each keystroke. AI is
not part of the current product.

Goal data and version history stay local to the device. Export and import include
both the current documents and their history; older goal-state JSON backups can
still be imported as a new baseline. On the original web origin, people can
explicitly import their old app's browser data without deleting the original
copy. See `web/src/domain/` for the data contracts.

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
