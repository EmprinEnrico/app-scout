// Tests for visible objective diffs and task completion changes.
import { describe, expect, it } from "vitest";
import { diffObjective, snapshotTasks, taskStatusChanges } from "./objectiveDiff";

describe("objective snapshot diff", () => {
  it("marks line additions and deletions while hiding metadata", () => {
    const before = "# Goal\n<!-- scout-journey:objective {\"id\":\"a\"} -->\nOld";
    const after = "# Goal\n<!-- scout-journey:objective {\"id\":\"b\"} -->\nNew";
    expect(diffObjective(before, after).map(({ type, text, kind }) => ({ type, text, kind })))
      .toEqual([
        { type: "same", text: "# Goal", kind: "title" },
        { type: "removed", text: "Old", kind: "text" },
        { type: "added", text: "New", kind: "text" },
      ]);
  });

  it("preserves heading and task presentation kinds for changed lines", () => {
    const before = "# Goal\n# First step";
    const after = "# Goal\n# New step\n- Read";
    expect(diffObjective(before, after).map(({ type, text, kind }) => ({ type, text, kind })))
      .toEqual([
        { type: "same", text: "# Goal", kind: "title" },
        { type: "removed", text: "# First step", kind: "milestone" },
        { type: "added", text: "# New step", kind: "milestone" },
        { type: "added", text: "- Read", kind: "task" },
      ]);
  });

  it("shows completion for each snapshot and identifies duplicate titles by metadata id", () => {
    const before = [
      '<!-- scout-journey:task {"id":"task-a","completed":false} -->', "- Read",
      '<!-- scout-journey:task {"id":"task-b","completed":false} -->', "- Read",
    ].join("\n");
    const after = before.replace('"id":"task-b","completed":false',
      '"id":"task-b","completed":true');
    expect(snapshotTasks(after)).toEqual([
      { id: "task-a", title: "Read", completed: false },
      { id: "task-b", title: "Read", completed: true },
    ]);
    expect(taskStatusChanges(before, after)).toEqual([
      { id: "task-b", title: "Read", from: false, to: true },
    ]);
  });
});
