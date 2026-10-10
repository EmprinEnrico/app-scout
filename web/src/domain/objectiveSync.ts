// Objective synchronization: applies parsed Markdown blocks to persisted entities.
import type { Area, Goal, Stage } from "./contracts";
import type { MarkdownBlock } from "./objectiveMarkdown";

export function syncObjective({
  area,
  blocks,
  stages,
  goals,
  renameStage,
  deleteStage,
  addStage,
  addGoal,
  updateGoal,
  deleteGoal,
}: {
  area: Area;
  blocks: MarkdownBlock[];
  stages: Stage[];
  goals: Goal[];
  renameStage: (id: string, name: string) => void;
  deleteStage: (id: string) => void;
  addStage: (areaId: string, name: string) => string;
  addGoal: (input: { title: string; areaId: string; stageId: string }) => void;
  updateGoal: (id: string, patch: { title: string; stageId: string }) => void;
  deleteGoal: (id: string) => void;
}) {
  const areaStages = stages
    .filter((stage) => stage.areaId === area.id)
    .sort((left, right) => left.position - right.position);
  const retainedGoalIds = new Set<string>();

  blocks.forEach((block, index) => {
    const existingStage = areaStages[index];
    const stageId = existingStage
      ? existingStage.id
      : addStage(area.id, block.name);
    if (existingStage && existingStage.name !== block.name) {
      renameStage(existingStage.id, block.name);
    }

    const existingGoals = existingStage
      ? goals.filter((goal) => goal.stageId === existingStage.id)
      : [];
    block.goals.forEach((title, goalIndex) => {
      const existingGoal = existingGoals[goalIndex];
      if (!existingGoal) {
        addGoal({ title, areaId: area.id, stageId });
        return;
      }
      retainedGoalIds.add(existingGoal.id);
      if (existingGoal.title !== title || existingGoal.stageId !== stageId) {
        updateGoal(existingGoal.id, { title, stageId });
      }
    });
  });

  goals
    .filter((goal) => goal.areaId === area.id && !retainedGoalIds.has(goal.id))
    .forEach((goal) => deleteGoal(goal.id));

  const firstStage = areaStages[0];
  if (!blocks.length && firstStage) renameStage(firstStage.id, "Primi passi");
  areaStages
    .slice(Math.max(blocks.length, 1))
    .reverse()
    .forEach((stage) => deleteStage(stage.id));
}
