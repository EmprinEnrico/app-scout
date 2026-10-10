// Settings component contracts shared by the focused settings panels.
import type { Area, Stage } from "../../domain/contracts";

export type Renaming = { kind: "area" | "stage"; id: string; value: string };

export type RenameState = {
  renaming: Renaming | null;
  setRenaming: (value: Renaming | null) => void;
  saveRename: () => void;
};

export type AreasPanelProps = RenameState & {
  areas: Area[];
  newArea: string;
  setNewArea: (value: string) => void;
  addArea: (name: string) => void;
  deleteArea: (id: string) => void;
};

export type StagesPanelProps = RenameState & {
  areas: Area[];
  managedArea: Area | undefined;
  managedStages: Stage[];
  setManagedAreaId: (value: string) => void;
  newStage: string;
  setNewStage: (value: string) => void;
  addStage: (areaId: string, name: string) => void;
  deleteStage: (id: string) => void;
};
