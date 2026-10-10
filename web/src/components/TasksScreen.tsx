// Tasks screen: aggregates concrete tasks inside their milestones and objectives.
import { useLayoutEffect, useRef, useState } from "react";
import { Check, Circle } from "lucide-react";
import { useGoals } from "../domain/GoalsContext";
import type { Area, Goal, Stage } from "../domain/contracts";
import "../Hierarchy.css";
import "../Screens.css";

function TaskRow({
  goal,
  onToggle,
  onUpdate,
  onDelete,
}: {
  goal: Goal;
  onToggle: () => void;
  onUpdate: (title: string) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(goal.title);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [title]);

  function changeTitle(value: string) {
    setTitle(value);
    if (value.trim()) onUpdate(value);
    else onDelete();
  }

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
      <textarea
        ref={inputRef}
        className="task-title"
        aria-label="Testo della pratica"
        rows={1}
        value={title}
        onChange={(event) => changeTitle(event.target.value)}
      />
    </li>
  );
}

function ObjectiveTasks({
  area,
  stages,
  goals,
  onToggle,
  onUpdate,
  onDelete,
}: {
  area: Area;
  stages: Stage[];
  goals: Goal[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
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
                      onUpdate={(title) => onUpdate(goal.id, title)}
                      onDelete={() => onDelete(goal.id)}
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
  const { state, toggleGoal, updateGoal, deleteGoal } = useGoals();

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
              onUpdate={(id, title) => updateGoal(id, { title })}
              onDelete={deleteGoal}
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
