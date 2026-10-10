// App shell: provides the global layout and navigation for Scout Journey.
import { useState } from "react";
import { Compass, Settings2, Target } from "lucide-react";
import { GoalsProvider, useGoals } from "./domain/GoalsContext";
import { ObjectivesScreen } from "./components/ObjectivesScreen";
import { JourneyScreen } from "./components/JourneyScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import "./App.css";
import "./Screens.css";

type Tab = "objectives" | "journey" | "settings";

function ScoutJourney() {
  const { ready, error } = useGoals();
  const [tab, setTab] = useState<Tab>("objectives");

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
      <header className="site-header" aria-label="Intestazione" />
      <main className="main-content" id="main-content">
        {error && (
          <div className="notice notice-error" role="alert">
            {error}
          </div>
        )}
        {tab === "objectives" && <ObjectivesScreen />}
        {tab === "journey" && (
          <JourneyScreen onObjectives={() => setTab("objectives")} />
        )}
        {tab === "settings" && <SettingsScreen />}
      </main>
      <nav className="bottom-nav" aria-label="Navigazione principale">
        <button
          type="button"
          className={tab === "objectives" ? "active" : ""}
          aria-current={tab === "objectives" ? "page" : undefined}
          onClick={() => setTab("objectives")}
        >
          <Target size={20} />
          <span>Objectives</span>
        </button>
        <button
          type="button"
          className={tab === "journey" ? "active" : ""}
          aria-current={tab === "journey" ? "page" : undefined}
          onClick={() => setTab("journey")}
        >
          <Compass size={20} />
          <span>Journey</span>
        </button>
        <button
          type="button"
          className={tab === "settings" ? "active" : ""}
          aria-current={tab === "settings" ? "page" : undefined}
          onClick={() => setTab("settings")}
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
