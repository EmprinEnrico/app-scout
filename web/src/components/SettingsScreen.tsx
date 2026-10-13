// Settings screen: provides data portability and project information.
import { UserCircle } from "lucide-react";
import { useGoals } from "../domain/GoalsContext";
import { DataPanel } from "./settings/DataPanel";

export function SettingsScreen() {
  const { exportData, importData, resetData } = useGoals();

  return (
    <section className="settings-page" aria-label="Impostazioni">
      <section className="settings-panel profile-panel" aria-labelledby="profile-title">
        <div className="panel-heading">
          <span className="panel-icon"><UserCircle size={20} /></span>
          <div>
            <h2 id="profile-title">Profilo</h2>
            <p>Il tuo spazio personale, in arrivo.</p>
          </div>
        </div>
        <div className="profile-preview">
          <UserCircle className="profile-preview-icon" size={42} strokeWidth={1.5} />
          <div>
            <strong>Utente mock</strong>
            <p>Account non collegato</p>
          </div>
          <span className="mock-badge">Mock</span>
        </div>
      </section>
      <DataPanel
        exportData={exportData}
        importData={importData}
        resetData={resetData}
      />
    </section>
  );
}
