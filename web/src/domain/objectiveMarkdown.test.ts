// Objective Markdown tests: protect the file format and user-facing body parser.
import { describe, expect, it } from "vitest";
import type { Area, Goal, Stage } from "./contracts";
import {
  objectiveLineEndPosition,
  objectiveStageEndPosition,
  objectiveToMarkdownFile,
  parseObjectiveFile,
  parseObjectiveMarkdown,
} from "./objectiveMarkdown";

const area: Area = {
  id: "area-1", name: "Learn Spanish", color: "#6366f1", createdAt: "2020-01-01T00:00:00.000Z",
};
const stages: Stage[] = [
  { id: "stage-1", areaId: area.id, name: "Milestone 1", position: 0 },
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

  it("turns the editable body into milestones and tasks", () => {
    expect(parseObjectiveMarkdown("Milestone 1\n- Read\n- Practice\n\nMilestone 2")).toEqual([
      { name: "Milestone 1", goals: ["Read", "Practice"] },
      { name: "Milestone 2", goals: [] },
    ]);
  });

  it("places the caret at the end of the selected line", () => {
    expect(objectiveLineEndPosition(stages, goals, { stageId: stages[0]!.id })).toBe(11);
    expect(objectiveLineEndPosition(stages, goals, {
      stageId: stages[0]!.id, goalId: goals[0]!.id,
    })).toBe(25);
    expect(objectiveStageEndPosition(stages, goals, stages[0]!.id)).toBe(25);
  });
});
