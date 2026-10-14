// Line based objective snapshot diffs with private metadata removed from display.

export type DiffLine = {
  type: "same" | "added" | "removed";
  text: string;
  taskId?: string;
  completed?: boolean;
  kind: "title" | "milestone" | "task" | "text";
};
export type TaskStatusChange = {
  id: string;
  title: string;
  from: boolean;
  to: boolean;
};
export type SnapshotTask = { id: string; title: string; completed: boolean };

function parseLines(content: string): DiffLine[] {
  const result: DiffLine[] = [];
  let pendingTask: { id?: string; completed: boolean } | undefined;
  for (const text of content.split(/\r?\n/)) {
    const metadataMatch = text.match(/<!--\s*scout-journey:task\s+(\{.*\})\s*-->/);
    if (/^\s*<!--\s*scout-journey:/.test(text)) {
      if (metadataMatch) {
        try {
          const value: unknown = JSON.parse(metadataMatch[1]!);
          if (typeof value === "object" && value !== null) {
            const task = value as { id?: unknown; completed?: unknown };
            pendingTask = {
              id: typeof task.id === "string" ? task.id : undefined,
              completed: task.completed === true,
            };
          }
        } catch {
          pendingTask = undefined;
        }
      }
      continue;
    }
    const taskLine = text.match(/^(\s*)-\s+(.*)$/);
    if (taskLine) {
      result.push({
        type: "same", text, kind: "task", taskId: pendingTask?.id,
        completed: pendingTask?.completed ?? false,
      });
      pendingTask = undefined;
      continue;
    }
    pendingTask = undefined;
    result.push({
      type: "same", text,
      kind: /^# /.test(text) ? (result.some((line) => line.kind === "title") ? "milestone" : "title") : "text",
    });
  }
  return result;
}

export function diffObjective(previous: string, current: string): DiffLine[] {
  const before = parseLines(previous);
  const after = parseLines(current);
  const table = Array.from({ length: before.length + 1 }, () =>
    Array<number>(after.length + 1).fill(0),
  );
  for (let i = before.length - 1; i >= 0; i -= 1) {
    for (let j = after.length - 1; j >= 0; j -= 1) {
      table[i]![j] = before[i]!.text === after[j]!.text
        ? table[i + 1]![j + 1]! + 1
        : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
    }
  }
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < before.length && j < after.length) {
    if (before[i]!.text === after[j]!.text) {
      result.push({ ...after[j]!, type: "same" });
      i += 1;
      j += 1;
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) {
      result.push({ ...before[i]!, type: "removed" });
      i += 1;
    } else {
      result.push({ ...after[j]!, type: "added" });
      j += 1;
    }
  }
  while (i < before.length) result.push({ ...before[i++]!, type: "removed" });
  while (j < after.length) result.push({ ...after[j++]!, type: "added" });
  return result;
}

export function taskStatusChanges(previous: string, current: string): TaskStatusChange[] {
  const before = new Map(snapshotTasks(previous).map((task) => [task.id, task]));
  return snapshotTasks(current).flatMap((task) => {
    const oldTask = before.get(task.id);
    return oldTask && oldTask.completed !== task.completed
      ? [{ id: task.id, title: task.title, from: oldTask.completed, to: task.completed }]
      : [];
  });
}

export function snapshotTasks(content: string): SnapshotTask[] {
  return parseLines(content).flatMap((line) => line.kind === "task" && line.taskId
    ? [{ id: line.taskId, title: line.text.replace(/^\s*-\s+/, ""), completed: line.completed ?? false }]
    : []);
}
