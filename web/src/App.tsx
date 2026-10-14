// App shell: provides the global layout and navigation for Scout Journey.
import { useEffect, useState } from "react";
import { Compass, Settings2, Target, UserCircle } from "lucide-react";
import { GoalsProvider, useGoals } from "./domain/GoalsContext";
import { ObjectivesScreen } from "./components/ObjectivesScreen";
import { JourneyScreen } from "./components/JourneyScreen";
import { ObjectiveHistory } from "./components/ObjectiveHistory";
import { SettingsScreen } from "./components/SettingsScreen";
import type { ObjectiveVersion } from "./domain/objectiveHistory";
import "./App.css";
import "./Screens.css";

type Tab = "objectives" | "journey" | "settings";

function HistoryView({ areaId, onBack }: { areaId: string; onBack: () => void }) {
  const { state, getObjectiveVersions } = useGoals();
  const [versions, setVersions] = useState<ObjectiveVersion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const area = state.areas.find((item) => item.id === areaId);

  useEffect(() => {
    let active = true;
    void getObjectiveVersions(areaId).then((loaded) => {
      if (active) setVersions(loaded);
    }).catch(() => {
      if (active) setError("Non è stato possibile caricare la storia.");
    });
    return () => { active = false; };
  }, [areaId, getObjectiveVersions]);

  if (!area) return null;
  if (error) return <p role="alert">{error}</p>;
  if (!versions) return <p role="status">Caricamento della storia…</p>;
  return <ObjectiveHistory areaName={area.name} versions={versions} onBack={onBack} />;
}

function ScoutJourney() {
  const { ready, error } = useGoals();
  const [tab, setTab] = useState<Tab>("objectives");
  const [historyAreaId, setHistoryAreaId] = useState<string | null>(null);

  function selectTab(next: Tab) {
    setHistoryAreaId(null);
    setTab(next);
  }

  if (!ready)
    return (
      <main className="loading-screen" role={error ? "alert" : "status"}>
        <Compass size={30} />
        <p>{error ?? "Prepariamo il tuo spazio..."}</p>
      </main>
    );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Vai al contenuto
      </a>
      <header className="site-header" aria-label="Intestazione">
        <span aria-hidden="true" />
        <details className="profile-menu">
          <summary className="profile-button" aria-label="Apri menu utente">
            <UserCircle size={25} strokeWidth={1.8} />
          </summary>
          <div className="profile-menu-popover" role="menu" aria-label="Menu utente">
            <div className="profile-menu-heading">
              <UserCircle size={31} strokeWidth={1.5} />
              <div>
                <strong>Utente mock</strong>
                <span>Account non collegato</span>
              </div>
            </div>
            <div className="profile-menu-divider" />
            <button type="button" role="menuitem" disabled>Profilo</button>
            <button type="button" role="menuitem" disabled>Impostazioni account</button>
            <button type="button" role="menuitem" disabled>Esci</button>
          </div>
        </details>
      </header>
      <main className="main-content" id="main-content">
        {error && (
          <div className="notice notice-error" role="alert">
            {error}
          </div>
        )}
        {tab === "objectives" && <ObjectivesScreen />}
        {tab === "journey" && (historyAreaId
          ? <HistoryView areaId={historyAreaId} onBack={() => setHistoryAreaId(null)} />
          : <JourneyScreen
              onObjectives={() => selectTab("objectives")}
              onOpenHistory={setHistoryAreaId}
            />)}
        {tab === "settings" && <SettingsScreen />}
      </main>
      <nav className="bottom-nav" aria-label="Navigazione principale">
        <button
          type="button"
          className={tab === "objectives" ? "active" : ""}
          aria-current={tab === "objectives" ? "page" : undefined}
          onClick={() => selectTab("objectives")}
        >
          <Target size={20} />
          <span>Objectives</span>
        </button>
        <button
          type="button"
          className={tab === "journey" ? "active" : ""}
          aria-current={tab === "journey" ? "page" : undefined}
          onClick={() => selectTab("journey")}
        >
          <Compass size={20} />
          <span>Journey</span>
        </button>
        <button
          type="button"
          className={tab === "settings" ? "active" : ""}
          aria-current={tab === "settings" ? "page" : undefined}
          onClick={() => selectTab("settings")}
        >
          <Settings2 size={20} />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}

function App() {
  return (
    <GoalsProvider>
      <ScoutJourney />
    </GoalsProvider>
  );
}

export default App;
