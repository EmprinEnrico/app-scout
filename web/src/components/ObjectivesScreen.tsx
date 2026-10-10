// Objectives screen: edits each objective as one Markdown-like text document.
import { useState, type FormEvent, type MouseEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useGoals } from "../domain/GoalsContext";
import type { Area, Goal, Stage } from "../domain/contracts";
import {
  objectiveLineEndPosition,
  objectiveToMarkdown,
  parseObjectiveMarkdown,
} from "../domain/objectiveMarkdown";
import { syncObjective } from "../domain/objectiveSync";
import { SwipeObjective } from "./SwipeObjective";
import { MarkdownEditor } from "./MarkdownEditor";
import "../Hierarchy.css";
import "../Screens.css";

function InlineTitle({
  value,
  label,
  onUpdate,
}: {
  value: string;
  label: string;
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
      className="hierarchy-title objective-title"
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
  onAddStage,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}: {
  area: Area;
  stages: Stage[];
  goals: Goal[];
  onRenameArea: (id: string, name: string) => void;
  onDeleteArea: (id: string) => void;
  onRenameStage: (id: string, name: string) => void;
  onDeleteStage: (id: string) => void;
  onToggleGoal: (id: string) => void;
  onAddStage: (areaId: string, name: string) => string;
  onAddGoal: (input: { title: string; areaId: string; stageId: string }) => void;
  onUpdateGoal: (id: string, patch: { title: string; stageId: string }) => void;
  onDeleteGoal: (id: string) => void;
}) {
  const [editSession, setEditSession] = useState<{
    value: string;
    caret: number;
  } | null>(null);
  const editing = editSession !== null;
  const areaStages = stages.filter((stage) => stage.areaId === area.id);
  const areaGoals = goals.filter((goal) => goal.areaId === area.id);

  function enterEdit(stageId?: string, goalId?: string) {
    const markdown = objectiveToMarkdown(areaStages, areaGoals);
    const linePosition = objectiveLineEndPosition(areaStages, areaGoals, { stageId, goalId });
    setEditSession({
      value: markdown,
      caret: Math.min(markdown.length, linePosition),
    });
  }

  function handleBodyClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const goalId = target.closest<HTMLElement>("[data-goal-id]")?.dataset.goalId;
    const stageId = target.closest<HTMLElement>("[data-stage-id]")?.dataset.stageId;
    enterEdit(stageId, goalId);
  }

  function exitEdit(value: string) {
    if (!editing) return;
    setEditSession(null);
    syncObjective({
      area,
      blocks: parseObjectiveMarkdown(value),
      stages,
      goals,
      renameStage: onRenameStage,
      deleteStage: onDeleteStage,
      addStage: onAddStage,
      addGoal: onAddGoal,
      updateGoal: onUpdateGoal,
      deleteGoal: onDeleteGoal,
    });
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
            onUpdate={(name) => onRenameArea(area.id, name)}
          />
        </header>
        {editing && editSession ? (
          <MarkdownEditor
            initialValue={editSession.value}
            initialCaret={editSession.caret}
            ariaLabel={`Testo dell’obiettivo ${area.name}`}
            onExit={exitEdit}
          />
        ) : (
          <div className="hierarchy-milestones" onClick={handleBodyClick}>
            {areaStages.map((stage) => (
              <section className="hierarchy-milestone" key={stage.id} data-stage-id={stage.id}>
                <header className="hierarchy-heading">
                  <h3>{stage.name}</h3>
                  <button
                    className="icon-button danger-hover"
                    type="button"
                    aria-label={`Elimina ${stage.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (window.confirm(
                        `Eliminare “${stage.name}”? Le pratiche saranno spostate nel primo milestone.`,
                      )) onDeleteStage(stage.id);
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </header>
                <ul className="hierarchy-task-list">
                  {goals.filter((goal) => goal.stageId === stage.id).map((goal) => (
                    <li className="simple-goal-row" key={goal.id} data-goal-id={goal.id}>
                      <button
                        className="task-check"
                        type="button"
                        aria-label={goal.completed ? `Riattiva ${goal.title}` : `Completa ${goal.title}`}
                        aria-pressed={goal.completed}
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleGoal(goal.id);
                        }}
                      >
                        {goal.completed ? "✓" : ""}
                      </button>
                      <span className={goal.completed ? "task-title is-complete" : "task-title"}>
                        {goal.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <button
              className="live-entry"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                enterEdit();
              }}
            >
              Scrivi un milestone o una task…
            </button>
          </div>
        )}
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
    renameStage,
    deleteStage,
    addStage,
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
            onAddStage={addStage}
            onAddGoal={addGoal}
            onUpdateGoal={updateGoal}
            onDeleteGoal={deleteGoal}
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
