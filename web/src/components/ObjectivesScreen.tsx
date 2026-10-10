// Objectives screen: edits the objective, milestone, and concrete practice hierarchy.
import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useGoals } from "../domain/GoalsContext";
import type { Area, Goal, Stage } from "../domain/contracts";
import { GoalComposer } from "./GoalComposer";
import { SwipeGoalRow } from "./SwipeGoalRow";
import "../Hierarchy.css";
import "../Screens.css";

function InlineTitle({
  value,
  label,
  className,
  onUpdate,
}: {
  value: string;
  label: string;
  className?: string;
  onUpdate: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  function change(nextValue: string) {
    setDraft(nextValue);
    if (nextValue.trim()) onUpdate(nextValue);
  }

  function restoreIfEmpty() {
    if (!draft.trim()) setDraft(value);
  }

  return (
    <input
      className={`hierarchy-title ${className ?? ""}`}
      aria-label={label}
      value={draft}
      onChange={(event) => change(event.target.value)}
      onBlur={restoreIfEmpty}
    />
  );
}

function ObjectiveCard({
  area,
  stages,
  goals,
  onRenameArea,
  onDeleteArea,
  onRenameStage,
  onDeleteStage,
  onToggleGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddStage,
}: {
  area: Area;
  stages: Stage[];
  goals: Goal[];
  onRenameArea: (id: string, name: string) => void;
  onDeleteArea: (id: string) => void;
  onRenameStage: (id: string, name: string) => void;
  onDeleteStage: (id: string) => void;
  onToggleGoal: (id: string) => void;
  onUpdateGoal: (id: string, title: string) => void;
  onDeleteGoal: (id: string) => void;
  onAddStage: (areaId: string, name: string) => void;
}) {
  const areaStages = stages
    .filter((stage) => stage.areaId === area.id)
    .sort((left, right) => left.position - right.position);
  const [newStage, setNewStage] = useState("");

  function addStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newStage.trim()) return;
    onAddStage(area.id, newStage.trim());
    setNewStage("");
  }

  return (
    <article className="hierarchy-objective">
      <header className="hierarchy-objective-heading">
        <span className="area-dot large" style={{ backgroundColor: area.color }} />
        <InlineTitle
          value={area.name}
          label="Nome dell’obiettivo"
          className="objective-title"
          onUpdate={(name) => onRenameArea(area.id, name)}
        />
        <button
          className="icon-button danger-hover"
          type="button"
          aria-label={`Elimina ${area.name}`}
          onClick={() => {
            if (window.confirm(`Eliminare “${area.name}” e tutto il suo contenuto?`)) {
              onDeleteArea(area.id);
            }
          }}
        >
          <Trash2 size={16} />
        </button>
      </header>
      <div className="hierarchy-milestones">
        {areaStages.map((stage) => {
          const stageGoals = goals.filter((goal) => goal.stageId === stage.id);
          return (
            <section className="hierarchy-milestone" key={stage.id}>
              <header className="hierarchy-heading">
                <InlineTitle
                  value={stage.name}
                  label="Nome del milestone"
                  className="milestone-title"
                  onUpdate={(name) => onRenameStage(stage.id, name)}
                />
                <button
                  className="icon-button danger-hover"
                  type="button"
                  aria-label={`Elimina ${stage.name}`}
                  onClick={() => {
                    if (window.confirm(
                      `Eliminare “${stage.name}”? Le pratiche saranno spostate nel primo milestone.`,
                    )) {
                      onDeleteStage(stage.id);
                    }
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </header>
              <ul className="hierarchy-task-list">
                {stageGoals.map((goal) => (
                  <SwipeGoalRow
                    key={goal.id}
                    goal={goal}
                    onToggle={() => onToggleGoal(goal.id)}
                    onUpdate={(title) => onUpdateGoal(goal.id, title)}
                    onDelete={() => onDeleteGoal(goal.id)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <form className="hierarchy-add milestone-add" onSubmit={addStage}>
        <input
          aria-label={`Aggiungi milestone a ${area.name}`}
          placeholder="Aggiungi un milestone…"
          value={newStage}
          onChange={(event) => setNewStage(event.target.value)}
        />
        <button className="button button-secondary" type="submit">
          <Plus size={16} /> Milestone
        </button>
      </form>
    </article>
  );
}

export function ObjectivesScreen() {
  const {
    state,
    addArea,
    renameArea,
    deleteArea,
    addStage,
    renameStage,
    deleteStage,
    addGoal,
    updateGoal,
    toggleGoal,
    deleteGoal,
  } = useGoals();
  const [newArea, setNewArea] = useState("");

  return (
    <section className="objectives-page" aria-label="Obiettivi">
      <div className="hierarchy-list">
        {state.areas.map((area) => (
          <ObjectiveCard
            key={area.id}
            area={area}
            stages={state.stages}
            goals={state.goals}
            onRenameArea={renameArea}
            onDeleteArea={deleteArea}
            onRenameStage={renameStage}
            onDeleteStage={deleteStage}
            onToggleGoal={toggleGoal}
            onUpdateGoal={(id, title) => updateGoal(id, { title })}
            onDeleteGoal={deleteGoal}
            onAddStage={addStage}
          />
        ))}
      </div>
      <form
        className="new-objective"
        onSubmit={(event) => {
          event.preventDefault();
          if (!newArea.trim()) return;
          addArea(newArea.trim());
          setNewArea("");
        }}
      >
        <input
          aria-label="Nome del nuovo obiettivo"
          placeholder="Inizia un nuovo obiettivo…"
          value={newArea}
          onChange={(event) => setNewArea(event.target.value)}
        />
        <button className="button button-primary" type="submit">
          <Pencil size={16} /> Obiettivo
        </button>
      </form>
      <GoalComposer
        areas={state.areas}
        stages={state.stages}
        onAdd={(title, areaId, stageId) => addGoal({ title, areaId, stageId })}
      />
    </section>
  );
}
