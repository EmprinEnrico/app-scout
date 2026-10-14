// Markdown file store: persists one objective document per local IndexedDB record.
import Dexie, { type Table } from "dexie";
import type { GoalState } from "./contracts";
import { objectiveToMarkdownFile, parseObjectiveFile } from "./objectiveMarkdown";
import { assertGoalState } from "./validation";
import {
  parseObjectiveHistory,
  serializeObjectiveHistory,
  type ObjectiveVersion,
  type ObjectiveVersionReason,
} from "./objectiveHistory";

type ObjectiveFile = { fileName: string; content: string; updatedAt: string };
type Settings = { key: string; selectedAreaId: string; selectedStageId: string };
export type SaveGoalStateOptions = {
  versionAreaIds?: string[];
  reason?: "edit" | "completion";
};

class GoalsDatabase extends Dexie {
  objectiveFiles!: Table<ObjectiveFile, string>;
  settings!: Table<Settings, string>;
  objectiveVersions!: Table<ObjectiveVersion, string>;

  constructor() {
    super("scout-journey-files");
    this.version(1).stores({ objectiveFiles: "&fileName", settings: "&key" });
    this.version(2).stores({
      objectiveFiles: "&fileName",
      settings: "&key",
      objectiveVersions: "&id, areaId, createdAt",
    }).upgrade(async (transaction) => {
      const files = await transaction.table("objectiveFiles").toArray() as ObjectiveFile[];
      const versions = transaction.table("objectiveVersions");
      for (const file of files) {
        const areaId = file.fileName.slice(0, -3);
        await versions.add({
          id: crypto.randomUUID(), areaId, createdAt: file.updatedAt,
          content: file.content, reason: "baseline",
        } satisfies ObjectiveVersion);
      }
    });
  }
}

const db = new GoalsDatabase();
const SELECTION = "selection";

function stateFromFiles(files: ObjectiveFile[], initial: GoalState, settings?: Settings): GoalState {
  const parsed = files.map((file) => parseObjectiveFile(file.content));
  const areas = parsed.map((document) => document.area);
  const stages = parsed.flatMap((document) => document.stages);
  const goals = parsed.flatMap((document) => document.goals);
  const areaIds = new Set(areas.map((area) => area.id));
  const stageIds = new Set(stages.map((stage) => stage.id));
  const selectedAreaCandidate = settings?.selectedAreaId ?? initial.selectedAreaId;
  const selectedStageCandidate = settings?.selectedStageId ?? initial.selectedStageId;
  const selectedAreaId = areaIds.has(selectedAreaCandidate)
    ? selectedAreaCandidate
    : areas[0]!.id;
  const selectedStageId = stageIds.has(selectedStageCandidate)
    ? selectedStageCandidate
    : stages.find((stage) => stage.areaId === selectedAreaId)!.id;
  const state = { ...initial, areas, stages, goals, selectedAreaId, selectedStageId };
  assertGoalState(state);
  return state;
}

function filesFromState(state: GoalState, updatedAt: string): ObjectiveFile[] {
  return state.areas.map((area) => ({
    fileName: `${area.id}.md`,
    content: objectiveToMarkdownFile(
      area,
      state.stages.filter((stage) => stage.areaId === area.id),
      state.goals.filter((goal) => goal.areaId === area.id),
    ),
    updatedAt,
  }));
}

function selectionFromState(state: GoalState): Settings {
  return {
    key: SELECTION,
    selectedAreaId: state.selectedAreaId,
    selectedStageId: state.selectedStageId,
  };
}

export async function loadGoalState(initial: GoalState): Promise<GoalState> {
  const files = await db.objectiveFiles.toArray();
  const settings = await db.settings.get(SELECTION);
  if (files.length) return stateFromFiles(files, initial, settings);
  await saveGoalState(initial);
  return initial;
}

export async function saveGoalState(
  state: GoalState,
  options: SaveGoalStateOptions = {},
): Promise<void> {
  const updatedAt = new Date().toISOString();
  const files = filesFromState(state, updatedAt);
  await db.transaction(
    "rw", db.objectiveFiles, db.settings, db.objectiveVersions, async () => {
      const versionAreas = new Set(options.versionAreaIds ?? []);
      const versionReason: ObjectiveVersionReason = options.reason ?? "edit";
      const versions: ObjectiveVersion[] = [];
      for (const file of files) {
        const areaId = file.fileName.slice(0, -3);
        const existing = await db.objectiveFiles.get(file.fileName);
        if (!existing) {
          versions.push({
            id: crypto.randomUUID(), areaId,
            createdAt: file.updatedAt, content: file.content, reason: "baseline",
          });
        } else if (versionAreas.has(areaId) && existing.content !== file.content) {
          versions.push({
            id: crypto.randomUUID(), areaId,
            createdAt: file.updatedAt, content: file.content, reason: versionReason,
          });
        }
      }
      await db.objectiveFiles.clear();
      await db.objectiveFiles.bulkPut(files);
      if (versions.length) await db.objectiveVersions.bulkAdd(versions);
      await db.settings.put(selectionFromState(state));
    },
  );
}

export async function loadObjectiveVersions(areaId: string): Promise<ObjectiveVersion[]> {
  return (await db.objectiveVersions.where("areaId").equals(areaId).toArray())
    .sort(compareVersions);
}

function compareVersions(left: ObjectiveVersion, right: ObjectiveVersion): number {
  return left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id);
}

function nextVersionTime(history: ObjectiveVersion[], now: string): string {
  const latest = history.slice().sort(compareVersions).at(-1);
  if (!latest || latest.createdAt < now) return now;
  return new Date(Date.parse(latest.createdAt) + 1).toISOString();
}

export async function recordObjectiveVersion(
  areaId: string,
  reason: "edit" | "completion" = "edit",
): Promise<void> {
  await db.transaction("rw", db.objectiveFiles, db.objectiveVersions, async () => {
    const file = await db.objectiveFiles.get(`${areaId}.md`);
    if (!file) return;
    const history = (await db.objectiveVersions.where("areaId").equals(areaId).toArray())
      .sort(compareVersions);
    const latest = history[history.length - 1];
    if (latest?.content === file.content) return;
    const createdAt = nextVersionTime(history, new Date().toISOString());
    await db.objectiveVersions.add({
      id: crypto.randomUUID(), areaId, createdAt,
      content: file.content, reason,
    });
  });
}

export async function exportObjectiveHistory(): Promise<string> {
  return serializeObjectiveHistory(await db.objectiveVersions.toArray());
}

export async function importObjectiveHistory(input: string): Promise<void> {
  const versions = parseObjectiveHistory(input);
  await replaceObjectiveVersions(versions);
}

async function replaceObjectiveVersions(versions: ObjectiveVersion[]): Promise<void> {
  await db.transaction("rw", db.objectiveFiles, db.objectiveVersions, async () => {
    await db.objectiveVersions.clear();
    if (versions.length) await db.objectiveVersions.bulkAdd(versions);
    await addCurrentBaselines(versions);
  });
}

async function addCurrentBaselines(versions: ObjectiveVersion[]): Promise<void> {
  const currentFiles = await db.objectiveFiles.toArray();
  for (const file of currentFiles) {
    const areaId = file.fileName.slice(0, -3);
    if (versions.some((version) => version.areaId === areaId
      && version.content === file.content)) continue;
    await db.objectiveVersions.add({
      id: crypto.randomUUID(), areaId, createdAt: file.updatedAt,
      content: file.content, reason: "baseline",
    });
  }
}

export async function replaceGoalArchive(
  state: GoalState,
  versions: ObjectiveVersion[],
): Promise<void> {
  const normalizedVersions = parseObjectiveHistory(serializeObjectiveHistory(versions));
  const files = filesFromState(state, new Date().toISOString());
  await db.transaction(
    "rw", db.objectiveFiles, db.settings, db.objectiveVersions, async () => {
      await db.objectiveFiles.clear();
      await db.objectiveFiles.bulkPut(files);
      await db.settings.put(selectionFromState(state));
      await db.objectiveVersions.clear();
      if (normalizedVersions.length) {
        await db.objectiveVersions.bulkAdd(normalizedVersions);
      }
      for (const file of files) {
        const areaId = file.fileName.slice(0, -3);
        if (normalizedVersions.some((version) => version.areaId === areaId
          && version.content === file.content)) continue;
        await db.objectiveVersions.add({
          id: crypto.randomUUID(), areaId, createdAt: file.updatedAt,
          content: file.content, reason: "baseline",
        });
      }
    },
  );
}

export async function clearObjectiveHistory(): Promise<void> {
  await db.objectiveVersions.clear();
}
