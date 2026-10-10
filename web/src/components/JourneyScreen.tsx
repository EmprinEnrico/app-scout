// Journey screen: shows the qualitative record of areas, stages, and practices.
import { ArrowRight, Check, Compass } from "lucide-react";
import { useGoals } from "../domain/GoalsContext";
import type { Area, Goal, Stage } from "../domain/contracts";

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
        </div>
      </div>
      {areaStages.length ? (
        <div className="journey-stages">
          {areaStages.map((stage) => {
            const stageGoals = areaGoals.filter(
              (goal) => goal.stageId === stage.id,
            );
            return (
              <div className="journey-stage" key={stage.id}>
                <div className="journey-stage-heading">
                  <div>
                    <h3>{stage.name}</h3>
                  </div>
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

  return (
    <>
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
            Quando creerai le tue aree e le tue pratiche, potrai tornare qui
            per rileggere ciò che hai provato e imparato.
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
