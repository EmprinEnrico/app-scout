// Settings screen: provides data portability and project information.
import { useGoals } from "../domain/GoalsContext";
import { DataPanel } from "./settings/DataPanel";

export function SettingsScreen() {
  const { legacyDataAvailable, exportData, importData, importLegacyData, resetData } =
    useGoals();

  return (
    <section className="settings-page" aria-label="Impostazioni">
      <DataPanel
        legacyDataAvailable={legacyDataAvailable}
        exportData={exportData}
        importData={importData}
        importLegacyData={importLegacyData}
        resetData={resetData}
      />
    </section>
  );
}
