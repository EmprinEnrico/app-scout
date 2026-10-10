// Objectives screen: a live text editor for objectives, milestones, and goals.
import { useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useGoals } from "../domain/GoalsContext";
import type { Area, Goal, Stage } from "../domain/contracts";
import { GoalRow } from "./GoalRow";
import { SwipeObjective } from "./SwipeObjective";
import "../Hierarchy.css";
import "../Screens.css";

function InlineTitle({
  value,
  label,
  className,
  onUpdate,
  onFocus,
}: {
  value: string;
  label: string;
  className?: string;
  onUpdate: (value: string) => void;
  onFocus?: () => void;
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
      onFocus={onFocus}
      onChange={(event) => change(event.target.value)}
      onBlur={restoreIfEmpty}
    />
  );
}

function LiveEntry({
  hasMilestone,
  onCommit,
}: {
  hasMilestone: boolean;
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  function commit() {
    const nextValue = value.trim();
    if (!nextValue) return;
    onCommit(nextValue);
    setValue("");
  }

  return (
    <div className="live-entry">
      <input
        className="live-entry-input"
        aria-label="Scrivi un milestone o una task"
        placeholder={hasMilestone ? "Scrivi… oppure - una task" : "Scrivi un milestone…"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" || event.key === "Esc" || event.code === "Escape") {
            event.preventDefault();
            commit();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === "Escape" || event.key === "Esc" || event.code === "Escape") {
            event.preventDefault();
            commit();
          }
        }}
      />
    </div>
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
  onAddGoal,
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
  onAddStage: (areaId: string, name: string) => string;
  onAddGoal: (input: { title: string; areaId: string; stageId: string }) => void;
}) {
  const areaStages = stages
    .filter((stage) => stage.areaId === area.id)
    .sort((left, right) => left.position - right.position);
  const [activeStageId, setActiveStageId] = useState(areaStages[0]?.id ?? "");
  const activeStage = areaStages.find((stage) => stage.id === activeStageId)
    ?? areaStages.at(-1);

  function commitEntry(value: string) {
    if (value.startsWith("-")) {
      const title = value.slice(1).trim();
      if (title && activeStage) {
        onAddGoal({ title, areaId: area.id, stageId: activeStage.id });
      }
      return;
    }
    const stageId = onAddStage(area.id, value);
    setActiveStageId(stageId);
  }

  function deleteObjective() {
    if (window.confirm(`Eliminare “${area.name}” e tutto il suo contenuto?`)) {
      onDeleteArea(area.id);
    }
  }

  return (
    <SwipeObjective name={area.name} onDelete={deleteObjective}>
      <div className="hierarchy-objective">
      <header className="hierarchy-objective-heading">
        <span className="area-dot large" style={{ backgroundColor: area.color }} />
        <InlineTitle
          value={area.name}
          label="Nome dell’obiettivo"
          className="objective-title"
          onUpdate={(name) => onRenameArea(area.id, name)}
        />
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
                  onFocus={() => setActiveStageId(stage.id)}
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
                {stageGoals.map((goal: Goal) => (
                  <GoalRow
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
      <LiveEntry hasMilestone={areaStages.length > 0} onCommit={commitEntry} />
      </div>
    </SwipeObjective>
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

  function addObjective(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newArea.trim()) return;
    addArea(newArea.trim());
    setNewArea("");
  }

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
            onAddGoal={addGoal}
          />
        ))}
      </div>
      <form className="new-objective" onSubmit={addObjective}>
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
    </section>
  );
}
