// Objective Markdown tests: protect the file format and user-facing body parser.
import { describe, expect, it } from "vitest";
import type { Area, Goal, Stage } from "./contracts";
import { objectiveToMarkdownFile, parseObjectiveFile } from "./objectiveMarkdown";

const area: Area = {
  id: "area-1", name: "Learn Spanish", color: "#6366f1", createdAt: "2020-01-01T00:00:00.000Z",
};
const stages: Stage[] = [
  { id: "stage-1", areaId: area.id, name: "Milestone 1", position: 0, content: [
    { id: "task-1", kind: "task", text: "Read a page", goalId: "task-1" },
  ] },
];
const goals: Goal[] = [{
  id: "task-1", areaId: area.id, stageId: stages[0]!.id, title: "Read a page",
  note: "", completed: true, createdAt: area.createdAt, updatedAt: area.createdAt,
  completedAt: area.createdAt,
}];

describe("objective Markdown files", () => {
  it("round-trips an objective and hides metadata in Markdown rendering", () => {
    const file = objectiveToMarkdownFile(area, stages, goals);
    const parsed = parseObjectiveFile(file);

    expect(file).toContain("<!-- scout-journey:objective");
    expect(file).toContain("<!-- scout-journey:task");
    expect(parsed.area).toEqual(area);
    expect(parsed.stages).toEqual(stages);
    expect(parsed.goals).toEqual(goals);
  });

  it("round-trips text before, between, and after tasks", () => {
    const content = [
      "# Learn Spanish",
      "",
      "<!-- scout-journey:milestone {\"id\":\"stage-1\",\"position\":0} -->",
      "# Milestone 1",
      "Start with a small daily practice.",
      "<!-- scout-journey:task {\"id\":\"task-1\",\"completed\":false} -->",
      "- Read a page",
      "Review the new words every Sunday.",
      "",
    ].join("\n");
    const parsed = parseObjectiveFile(content);
    expect(parsed.stages[0]?.content?.map((line) => [line.kind, line.text])).toEqual([
      ["text", "Start with a small daily practice."],
      ["task", "Read a page"],
      ["text", "Review the new words every Sunday."],
    ]);
  });
});
