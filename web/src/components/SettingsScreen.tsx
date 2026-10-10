// Settings screen: provides data portability and project information.
import { useGoals } from "../domain/GoalsContext";
import { DataPanel } from "./settings/DataPanel";

export function SettingsScreen() {
  const { exportData, importData, resetData } = useGoals();

  return (
    <section className="settings-page" aria-label="Impostazioni">
      <DataPanel
        exportData={exportData}
        importData={importData}
        resetData={resetData}
      />
    </section>
  );
}
