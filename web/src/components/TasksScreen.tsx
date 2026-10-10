// Tasks screen: aggregates concrete tasks inside their milestones and objectives.
import { Check, Circle } from "lucide-react";
import { useGoals } from "../domain/GoalsContext";
import type { Area, Goal, Stage } from "../domain/contracts";
import "../Hierarchy.css";
import "../Screens.css";

function TaskRow({ goal, onToggle }: { goal: Goal; onToggle: () => void }) {
  return (
    <li className={`task-item ${goal.completed ? "is-complete" : ""}`}>
      <button
        className="task-check"
        type="button"
        aria-label={goal.completed ? `Riattiva ${goal.title}` : `Completa ${goal.title}`}
        aria-pressed={goal.completed}
        onClick={onToggle}
      >
        {goal.completed ? <Check size={14} strokeWidth={3} /> : <Circle size={14} />}
      </button>
      <span className="task-title">{goal.title}</span>
      {goal.completed && <span className="task-status">Completato</span>}
    </li>
  );
}

function ObjectiveTasks({
  area,
  stages,
  goals,
  onToggle,
}: {
  area: Area;
  stages: Stage[];
  goals: Goal[];
  onToggle: (id: string) => void;
}) {
  const areaStages = stages
    .filter((stage) => stage.areaId === area.id)
    .sort((left, right) => left.position - right.position);

  return (
    <article className="task-objective">
      <header className="task-objective-heading">
        <span className="area-dot large" style={{ backgroundColor: area.color }} />
        <h2>{area.name}</h2>
      </header>
      <div className="task-milestones">
        {areaStages.map((stage) => {
          const stageGoals = goals.filter((goal) => goal.stageId === stage.id);
          return (
            <section className="task-milestone" key={stage.id}>
              <h3>{stage.name}</h3>
              {stageGoals.length ? (
                <ul className="task-list">
                  {stageGoals.map((goal) => (
                    <TaskRow
                      key={goal.id}
                      goal={goal}
                      onToggle={() => onToggle(goal.id)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="task-empty">Nessuna pratica ancora.</p>
              )}
            </section>
          );
        })}
      </div>
    </article>
  );
}

export function TasksScreen({ onObjectives }: { onObjectives: () => void }) {
  const { state, toggleGoal } = useGoals();

  return (
    <section className="tasks-page" aria-label="Tutte le task">
      {state.areas.length ? (
        <div className="task-objectives">
          {state.areas.map((area) => (
            <ObjectiveTasks
              key={area.id}
              area={area}
              stages={state.stages}
              goals={state.goals}
              onToggle={toggleGoal}
            />
          ))}
        </div>
      ) : (
        <div className="empty-card wide-empty">
          <h3>Inizia da un obiettivo</h3>
          <p>Crea un obiettivo e aggiungi le prime pratiche concrete.</p>
          <button type="button" className="button button-primary" onClick={onObjectives}>
            Apri obiettivi
          </button>
        </div>
      )}
    </section>
  );
}
