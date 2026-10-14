// Objective Markdown helpers: serialize bodies and complete objective files.
import type { Area, Goal, Stage } from "./contracts";
import { newId } from "./goalState";

export type ParsedObjectiveFile = {
  area: Area;
  stages: Stage[];
  goals: Goal[];
};

type Metadata = Record<string, unknown>;

function metadataLine(kind: string, value: Metadata): string {
  return `<!-- scout-journey:${kind} ${JSON.stringify(value)} -->`;
}

function readMetadata(line: string): { kind: string; value: Metadata } | null {
  const match = line.trim().match(/^<!--\s*scout-journey:(\w+)\s+(\{.*\})\s*-->$/);
  if (!match) return null;
  const parsed: unknown = JSON.parse(match[2]!);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  return { kind: match[1]!, value: parsed as Metadata };
}

function textValue(value: Metadata, key: string, fallback: string): string {
  return typeof value[key] === "string" && value[key] ? value[key] as string : fallback;
}

function booleanValue(value: Metadata, key: string): boolean {
  return value[key] === true;
}

function nullableText(value: Metadata, key: string): string | null {
  return typeof value[key] === "string" ? value[key] as string : null;
}

export function objectiveToMarkdownFile(area: Area, stages: Stage[], goals: Goal[]): string {
  const orderedStages = stages.slice().sort((left, right) => left.position - right.position);
  const lines = [
    metadataLine("objective", { id: area.id, createdAt: area.createdAt, color: area.color }),
    `# ${area.name}`,
    "",
  ];
  orderedStages.forEach((stage, index) => {
    lines.push(metadataLine("milestone", {
      id: stage.id,
      position: stage.position,
      createdAt: area.createdAt,
    }));
    lines.push(`# ${stage.name}`);
    const stageLines = stage.content
      ? stage.content.map((line) => ({
        id: line.id, kind: line.kind, text: line.text,
        goal: line.goalId ? goals.find((item) => item.id === line.goalId) : undefined,
      }))
      : goals.filter((goal) => goal.stageId === stage.id)
        .map((goal) => ({ id: goal.id, kind: "task" as const, text: goal.title, goal }));
    stageLines.forEach((line) => {
      if (line.kind === "text") {
        lines.push(metadataLine("text", { id: line.id }));
        lines.push(line.text);
        return;
      }
      const goal = line.goal;
      if (!goal) return;
      lines.push(metadataLine("task", {
        id: goal.id,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
        completed: goal.completed,
        completedAt: goal.completedAt,
        note: goal.note,
      }));
      lines.push(`- ${goal.title}`);
    });
    if (index < orderedStages.length - 1) lines.push("");
  });
  return `${lines.join("\n")}\n`;
}

export function parseObjectiveFile(content: string): ParsedObjectiveFile {
  const now = new Date().toISOString();
  let areaMeta: Metadata | undefined;
  let pending: { kind: string; value: Metadata } | undefined;
  let areaName = "";
  const stages: Stage[] = [];
  const goals: Goal[] = [];
  let currentStage: Stage | undefined;

  for (const rawLine of content.split(/\r?\n/)) {
    const metadata = readMetadata(rawLine);
    if (metadata) {
      if (metadata.kind === "objective") areaMeta = metadata.value;
      else pending = metadata;
      continue;
    }
    const line = rawLine.trim();
    if (pending?.kind === "text") {
      if (!currentStage) throw new Error("Il testo deve appartenere a un milestone.");
      currentStage.content ??= [];
      currentStage.content.push({
        id: textValue(pending.value, "id", newId()), kind: "text", text: rawLine,
      });
      pending = undefined;
      continue;
    }
    if (!line) continue;
    if (line.startsWith("# ")) {
      const heading = line.slice(2).trim();
      if (!areaName) {
        areaName = heading;
        continue;
      }
      const stageMeta = pending?.kind === "milestone" ? pending.value : {};
      currentStage = {
        id: textValue(stageMeta, "id", newId()),
        areaId: textValue(areaMeta ?? {}, "id", newId()), name: heading,
        position: typeof stageMeta.position === "number" ? stageMeta.position : stages.length,
        content: [],
      };
      stages.push(currentStage);
      pending = undefined;
      continue;
    }
    if (line.startsWith("-")) {
      if (!currentStage) throw new Error("Una task deve appartenere a un milestone.");
      const title = line.slice(1).trim();
      if (!title) continue;
      const taskMeta = pending?.kind === "task" ? pending.value : {};
      const goalId = textValue(taskMeta, "id", newId());
      goals.push({
        id: goalId, areaId: textValue(areaMeta ?? {}, "id", newId()),
        stageId: currentStage.id, title, note: textValue(taskMeta, "note", ""),
        completed: booleanValue(taskMeta, "completed"),
        createdAt: textValue(taskMeta, "createdAt", now),
        updatedAt: textValue(taskMeta, "updatedAt", now),
        completedAt: booleanValue(taskMeta, "completed") ? nullableText(taskMeta, "completedAt") : null,
      });
      currentStage.content ??= [];
      currentStage.content.push({
        id: goalId, kind: "task", text: title, goalId,
      });
      pending = undefined;
      continue;
    }
    if (pending?.kind === "milestone") {
      const stageMeta = pending.value;
      currentStage = {
        id: textValue(stageMeta, "id", newId()),
        areaId: textValue(areaMeta ?? {}, "id", newId()), name: line,
        position: typeof stageMeta.position === "number" ? stageMeta.position : stages.length,
        content: [],
      };
      stages.push(currentStage);
      pending = undefined;
      continue;
    }
    if (!currentStage) continue;
    currentStage.content ??= [];
    currentStage.content.push({ id: newId(), kind: "text", text: line });
    pending = undefined;
  }

  const areaId = textValue(areaMeta ?? {}, "id", newId());
  const createdAt = textValue(areaMeta ?? {}, "createdAt", now);
  const area: Area = {
    id: areaId, name: areaName, color: textValue(areaMeta ?? {}, "color", "#385f48"), createdAt,
  };
  return { area, stages: stages.map((stage) => ({ ...stage, areaId })), goals };
}
