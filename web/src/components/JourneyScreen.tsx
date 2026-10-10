// Journey screen: summarizes progress across areas, stages, and goals.
import { ArrowRight, Check, Compass } from "lucide-react";
import { useGoals } from "../domain/GoalsContext";
import type { Area, Goal, Stage } from "../domain/contracts";
import { count } from "./format";
import { Progress } from "./ui";

function JourneyArea({
  area,
  stages,
  goals,
}: {
  area: Area;
  stages: Stage[];
  goals: Goal[];
}) {
  const areaStages = stages
    .filter((stage) => stage.areaId === area.id)
    .sort((a, b) => a.position - b.position);
  const areaGoals = goals.filter((goal) => goal.areaId === area.id);
  const areaDone = areaGoals.filter((goal) => goal.completed).length;

  return (
    <section className="journey-area" aria-labelledby={`journey-${area.id}`}>
      <div className="journey-area-heading">
        <span
          className="area-dot large"
          style={{ backgroundColor: area.color }}
          aria-hidden="true"
        />
        <div>
          <h2 id={`journey-${area.id}`}>{area.name}</h2>
          <p>
            {count(areaDone, "obiettivo completato", "obiettivi completati")} su{" "}
            {areaGoals.length}
          </p>
        </div>
        <span className="journey-percent">
          {areaGoals.length
            ? Math.round((areaDone / areaGoals.length) * 100)
            : 0}
          %
        </span>
      </div>
      <Progress done={areaDone} total={areaGoals.length} />
      {areaStages.length ? (
        <div className="journey-stages">
          {areaStages.map((stage, index) => {
            const stageGoals = areaGoals.filter(
              (goal) => goal.stageId === stage.id,
            );
            const completed = stageGoals.filter(
              (goal) => goal.completed,
            ).length;
            return (
              <div className="journey-stage" key={stage.id}>
                <div className="journey-stage-heading">
                  <span className="step-badge">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{stage.name}</h3>
                    <p>
                      {count(completed, "completato", "completati")} su{" "}
                      {stageGoals.length}
                    </p>
                  </div>
                  <span className="stage-fraction">
                    {completed}/{stageGoals.length}
                  </span>
                </div>
                {stageGoals.length ? (
                  <ul className="archive-list">
                    {stageGoals.map((goal) => (
                      <li
                        className={goal.completed ? "completed" : "pending"}
                        key={goal.id}
                      >
                        <span className="archive-icon" aria-hidden="true">
                          {goal.completed ? (
                            <Check size={13} strokeWidth={3} />
                          ) : null}
                        </span>
                        <span className="archive-title">{goal.title}</span>
                        <span className="journey-status">
                          {goal.completed ? "Completato" : "Da fare"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="stage-empty-note">
                    Nessun obiettivo in questa tappa.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="stage-empty-note no-stages">
          Nessuna tappa in quest’area. Puoi aggiungerne una dalle impostazioni.
        </p>
      )}
    </section>
  );
}

export function JourneyScreen({ onSettings }: { onSettings: () => void }) {
  const { state } = useGoals();
  const done = state.goals.filter((goal) => goal.completed).length;

  return (
    <>
      <section className="journey-summary" aria-label="Riepilogo del percorso">
        <div>
          <span className="eyebrow">FINORA</span>
          <strong>{done}</strong>
          <span>obiettivi completati</span>
        </div>
        <div>
          <span className="eyebrow">IN CAMMINO</span>
          <strong>{state.goals.length - done}</strong>
          <span>obiettivi da fare</span>
        </div>
        <div>
          <span className="eyebrow">I TUOI SPAZI</span>
          <strong>{state.areas.length}</strong>
          <span>{state.areas.length === 1 ? "area" : "aree"} da esplorare</span>
        </div>
      </section>
      {state.areas.length ? (
        <div className="journey-list">
          {state.areas.map((area) => (
            <JourneyArea
              key={area.id}
              area={area}
              stages={state.stages}
              goals={state.goals}
            />
          ))}
        </div>
      ) : (
        <div className="empty-card wide-empty">
          <span className="empty-icon">
            <Compass size={26} />
          </span>
          <h3>Il tuo percorso comincia da qui</h3>
          <p>
            Quando creerai le tue aree e i tuoi obiettivi, vedrai qui i
            progressi e i traguardi raggiunti.
          </p>
          <button
            type="button"
            className="button button-primary"
            onClick={onSettings}
          >
            Crea la prima area <ArrowRight size={16} />
          </button>
        </div>
      )}
    </>
  );
}
