// Settings screen: orchestrates focused panels for areas, stages, and data.
import { useState } from "react";
import { useGoals } from "../domain/GoalsContext";
import { AreasPanel } from "./settings/AreasPanel";
import { DataPanel } from "./settings/DataPanel";
import { StagesPanel } from "./settings/StagesPanel";
import type { Renaming } from "./settings/types";

export function SettingsScreen() {
  const {
    state, legacyDataAvailable, addArea, renameArea, deleteArea, addStage,
    deleteStage, renameStage, exportData, importData, importLegacyData, resetData,
  } = useGoals();
  const [newArea, setNewArea] = useState("");
  const [newStage, setNewStage] = useState("");
  const [managedAreaId, setManagedAreaId] = useState("");
  const [renaming, setRenaming] = useState<Renaming | null>(null);
  const managedArea = state.areas.find((item) => item.id === managedAreaId) ??
    state.areas.find((item) => item.id === state.selectedAreaId) ?? state.areas[0];
  const managedStages = state.stages
    .filter((item) => item.areaId === managedArea?.id)
    .sort((a, b) => a.position - b.position);

  function saveRename() {
    if (!renaming?.value.trim()) return;
    if (renaming.kind === "area") renameArea(renaming.id, renaming.value.trim());
    else renameStage(renaming.id, renaming.value.trim());
  }

  return (
    <>
      <div className="settings-grid">
        <AreasPanel
          areas={state.areas}
          newArea={newArea}
          setNewArea={setNewArea}
          addArea={addArea}
          deleteArea={deleteArea}
          renaming={renaming}
          setRenaming={setRenaming}
          saveRename={saveRename}
        />
        <StagesPanel
          areas={state.areas}
          managedArea={managedArea}
          managedStages={managedStages}
          setManagedAreaId={setManagedAreaId}
          newStage={newStage}
          setNewStage={setNewStage}
          addStage={addStage}
          deleteStage={deleteStage}
          renaming={renaming}
          setRenaming={setRenaming}
          saveRename={saveRename}
        />
      </div>
      <DataPanel
        legacyDataAvailable={legacyDataAvailable}
        exportData={exportData}
        importData={importData}
        importLegacyData={importLegacyData}
        resetData={resetData}
      />
    </>
  );
}
