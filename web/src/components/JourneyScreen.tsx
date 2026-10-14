// Read-only objective journey path built from the existing goal records.
import { ArrowRight, Check, Compass, Circle } from "lucide-react";
import { useGoals } from "../domain/GoalsContext";
import type { Area, Goal, Stage } from "../domain/contracts";
import "../JourneyPath.css";

function completionDate(goals: Goal[]): string | null {
  const dates = goals
    .map((goal) => goal.completedAt)
    .filter((date): date is string => Boolean(date))
    .sort((left, right) => Date.parse(right) - Date.parse(left));
  const latest = dates[0];
  if (!latest) return null;
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(latest));
}

function Milestone({ stage, goals }: { stage: Stage; goals: Goal[] }) {
  const tasks = goals.filter((goal) => goal.stageId === stage.id);
  const complete = tasks.length > 0 && tasks.every((goal) => goal.completed);
  const date = complete ? completionDate(tasks) : null;

  return (
    <li className={`journey-milestone${complete ? " is-complete" : ""}`}>
      <span className="journey-milestone-node" aria-hidden="true">
        {complete ? <Check size={14} strokeWidth={2.5} /> : <Circle size={9} />}
      </span>
      <div className="journey-milestone-content">
        <div className="journey-milestone-heading">
          <h3>{stage.name}</h3>
          {date && <time>{date}</time>}
        </div>
        {tasks.length > 0 && (
          <ul className="journey-task-list" aria-label={`Attività: ${stage.name}`}>
            {tasks.map((goal) => (
              <li
                className={`journey-task${goal.completed ? " is-complete" : ""}`}
                key={goal.id}
              >
                <span className="journey-task-mark" aria-hidden="true">
                  {goal.completed ? <Check size={11} strokeWidth={2.5} /> : null}
                </span>
                <span>{goal.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function JourneyArea({
  area,
  stages,
  goals,
  onOpenHistory,
}: {
  area: Area;
  stages: Stage[];
  goals: Goal[];
  onOpenHistory?: (areaId: string) => void;
}) {
  const areaStages = stages
    .filter((stage) => stage.areaId === area.id)
    .sort((left, right) => left.position - right.position);

  return (
    <section className="journey-path-area" aria-labelledby={`journey-${area.id}`}>
      <header className="journey-path-header">
        <span
          className="journey-path-dot"
          aria-hidden="true"
        />
        <button
          className="journey-path-title"
          id={`journey-${area.id}`}
          type="button"
          onClick={() => onOpenHistory?.(area.id)}
          aria-label={`Apri lo storico di ${area.name}`}
        >
          {area.name}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </header>
      {areaStages.length > 0 ? (
        <ol className="journey-path-list" aria-label={`Percorso: ${area.name}`}>
          {areaStages.map((stage) => (
            <Milestone
              key={stage.id}
              stage={stage}
              goals={goals.filter((goal) => goal.areaId === area.id)}
            />
          ))}
        </ol>
      ) : (
        <p className="journey-path-empty">Il percorso non ha ancora tappe.</p>
      )}
    </section>
  );
}

export function JourneyScreen({
  onObjectives,
  onOpenHistory,
}: {
  onObjectives: () => void;
  onOpenHistory?: (areaId: string) => void;
}) {
  const { state } = useGoals();

  if (!state.areas.length) {
    return (
      <div className="empty-card wide-empty journey-path-first">
        <span className="empty-icon"><Compass size={26} /></span>
        <h3>Il tuo percorso comincia da qui</h3>
        <p>Quando aggiungerai tappe e attività, le ritroverai qui.</p>
        <button type="button" className="button button-primary" onClick={onObjectives}>
          Crea il primo obiettivo <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="journey-path-listing">
      {state.areas.map((area) => (
        <JourneyArea
          key={area.id}
          area={area}
          stages={state.stages}
          goals={state.goals}
          onOpenHistory={onOpenHistory}
        />
      ))}
    </div>
  );
}
