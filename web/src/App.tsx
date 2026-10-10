// App shell: provides the global layout and navigation for Scout Journey.
import { useState } from "react";
import { Compass, Flag, Settings2 } from "lucide-react";
import { GoalsProvider, useGoals } from "./domain/GoalsContext";
import { GoalsScreen } from "./components/GoalsScreen";
import { JourneyScreen } from "./components/JourneyScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import "./App.css";
import "./Screens.css";

type Tab = "goals" | "journey" | "settings";
const today = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());

function ScoutJourney() {
  const { ready, error } = useGoals();
  const [tab, setTab] = useState<Tab>("goals");

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
      <header className="site-header">
        <div
          className="brand"
          aria-label="Scout Journey, il tuo spazio per gli obiettivi"
        >
          <span className="brand-mark">
            <img src="/icon-192.png" alt="" />
          </span>
          <span>Scout Journey</span>
        </div>
        <span className="header-date">{today}</span>
      </header>
      <main className="main-content" id="main-content">
        {error && (
          <div className="notice notice-error" role="alert">
            {error}
          </div>
        )}
        {tab === "goals" && (
          <GoalsScreen
            onJourney={() => setTab("journey")}
            onSettings={() => setTab("settings")}
          />
        )}
        {tab === "journey" && (
          <JourneyScreen onSettings={() => setTab("settings")} />
        )}
        {tab === "settings" && <SettingsScreen />}
      </main>
      <nav className="bottom-nav" aria-label="Navigazione principale">
        <button
          type="button"
          className={tab === "goals" ? "active" : ""}
          aria-current={tab === "goals" ? "page" : undefined}
          onClick={() => setTab("goals")}
        >
          <Flag size={20} />
          <span>Obiettivi</span>
        </button>
        <button
          type="button"
          className={tab === "journey" ? "active" : ""}
          aria-current={tab === "journey" ? "page" : undefined}
          onClick={() => setTab("journey")}
        >
          <Compass size={20} />
          <span>Percorso</span>
        </button>
        <button
          type="button"
          className={tab === "settings" ? "active" : ""}
          aria-current={tab === "settings" ? "page" : undefined}
          onClick={() => setTab("settings")}
        >
          <Settings2 size={20} />
          <span>Impostazioni</span>
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
