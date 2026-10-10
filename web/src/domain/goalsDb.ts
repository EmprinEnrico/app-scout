// Markdown file store: persists one objective document per local IndexedDB record.
import Dexie, { type Table } from "dexie";
import type { GoalState } from "./contracts";
import { objectiveToMarkdownFile, parseObjectiveFile } from "./objectiveMarkdown";
import { assertGoalState } from "./validation";

type ObjectiveFile = { fileName: string; content: string; updatedAt: string };
type Settings = { key: string; selectedAreaId: string; selectedStageId: string };

class GoalsDatabase extends Dexie {
  objectiveFiles!: Table<ObjectiveFile, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super("scout-journey-files");
    this.version(1).stores({ objectiveFiles: "&fileName", settings: "&key" });
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

export async function loadGoalState(initial: GoalState): Promise<GoalState> {
  const files = await db.objectiveFiles.toArray();
  const settings = await db.settings.get(SELECTION);
  if (files.length) return stateFromFiles(files, initial, settings);
  await saveGoalState(initial);
  return initial;
}

export async function saveGoalState(state: GoalState): Promise<void> {
  const updatedAt = new Date().toISOString();
  const files: ObjectiveFile[] = state.areas.map((area) => ({
    fileName: `${area.id}.md`,
    content: objectiveToMarkdownFile(
      area,
      state.stages.filter((stage) => stage.areaId === area.id),
      state.goals.filter((goal) => goal.areaId === area.id),
    ),
    updatedAt,
  }));
  await db.transaction("rw", db.objectiveFiles, db.settings, async () => {
    await db.objectiveFiles.clear();
    await db.objectiveFiles.bulkPut(files);
    await db.settings.put({
      key: SELECTION,
      selectedAreaId: state.selectedAreaId,
      selectedStageId: state.selectedStageId,
    });
  });
}
