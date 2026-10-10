// Objective Markdown helpers: serialize and parse the editable objective body.
import type { Goal, Stage } from "./contracts";

export type MarkdownBlock = {
  name: string;
  goals: string[];
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
