// Objective Markdown helpers: serialize and parse the editable objective body.
import type { Goal, Stage } from "./contracts";

export type MarkdownBlock = {
  name: string;
  goals: string[];
};

export type ObjectiveLineTarget = {
  stageId?: string;
  goalId?: string;
};

export function objectiveToMarkdown(stages: Stage[], goals: Goal[]): string {
  return stages
    .slice()
    .sort((left, right) => left.position - right.position)
    .map((stage) => {
      const stageGoals = goals
        .filter((goal) => goal.stageId === stage.id)
        .map((goal) => `- ${goal.title}`);
      return [stage.name, ...stageGoals].join("\n");
    })
    .join("\n\n");
}

export function objectiveLineEndPosition(
  stages: Stage[],
  goals: Goal[],
  target?: ObjectiveLineTarget,
): number {
  const orderedStages = stages.slice().sort((left, right) => left.position - right.position);
  let position = 0;

  for (const [stageIndex, stage] of orderedStages.entries()) {
    position += stage.name.length;
    if (stage.id === target?.stageId) return position;
    const stageGoals = goals.filter((goal) => goal.stageId === stage.id);
    for (const goal of stageGoals) {
      position += 1;
      position += `- ${goal.title}`.length;
      if (goal.id === target?.goalId) return position;
    }
    if (stageIndex < orderedStages.length - 1) position += 2;
  }
  return position;
}

export function parseObjectiveMarkdown(value: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let current: MarkdownBlock | undefined;

  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("-")) {
      const title = line.slice(1).trim();
      if (!title) continue;
      current ??= { name: "Primi passi", goals: [] };
      if (!blocks.includes(current)) blocks.push(current);
      current.goals.push(title);
      continue;
    }
    current = { name: line, goals: [] };
    blocks.push(current);
  }
  return blocks;
}
