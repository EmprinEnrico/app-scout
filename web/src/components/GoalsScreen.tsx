// Goals screen: provides the inline, note-like editor for everyday goals.
import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { useGoals } from "../domain/GoalsContext";
import type { Goal } from "../domain/contracts";
import "../Notes.css";

export function GoalsScreen({
  onSettings,
}: {
  onJourney?: () => void;
  onSettings: () => void;
}) {
  const {
    state,
    addGoal,
    updateGoal,
    toggleGoal,
    deleteGoal,
    selectArea,
    selectStage,
  } = useGoals();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newDraft, setNewDraft] = useState("");
  const area =
    state.areas.find((item) => item.id === state.selectedAreaId) ??
    state.areas[0];
  const stages = state.stages
    .filter((item) => item.areaId === area?.id)
    .sort((a, b) => a.position - b.position);
  const stage =
    stages.find((item) => item.id === state.selectedStageId) ?? stages[0];
  const stageIndex = stages.findIndex((item) => item.id === stage?.id);
  const goals = state.goals.filter(
    (item) => item.areaId === area?.id && item.stageId === stage?.id,
  );

  function titleFor(goal: Goal) {
    return drafts[goal.id] ?? goal.title;
  }
  function saveTitle(goal: Goal) {
    const title = titleFor(goal).trim();
    setDrafts((current) => {
      const next = { ...current };
      delete next[goal.id];
      return next;
    });
    if (title && title !== goal.title) updateGoal(goal.id, { title });
    if (!title) deleteGoal(goal.id);
  }
  function addNewGoal() {
    const title = newDraft.trim();
    if (!title || !area || !stage) return;
    addGoal({ title, areaId: area.id, stageId: stage.id });
    setNewDraft("");
  }

  return (
    <section className="notes-page" aria-label="Scrittura degli obiettivi">
      <header className="notes-header">
        {state.areas.length > 0 && (
          <button
            className="notes-selector"
            type="button"
            onClick={onSettings}
            aria-label="Gestisci aree e tappe"
          >
            <span
              className="area-dot"
              style={{ backgroundColor: area?.color }}
              aria-hidden="true"
            />
            <span>{area?.name ?? "Scegli un’area"}</span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
        )}
      </header>

      {area && stages.length > 0 && stage ? (
        <>
          <div className="notes-toolbar">
            <button
              type="button"
              aria-label="Tappa precedente"
              disabled={stageIndex <= 0}
              onClick={() => {
                const previous = stages[stageIndex - 1];
                if (previous) selectStage(previous.id);
              }}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              className="stage-picker"
              type="button"
              onClick={onSettings}
              title="Gestisci tappe"
            >
              <span>{stage.name}</span>
            </button>
            <button
              type="button"
              aria-label="Tappa successiva"
              disabled={stageIndex >= stages.length - 1}
              onClick={() => {
                const next = stages[stageIndex + 1];
                if (next) selectStage(next.id);
              }}
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="notes-list" role="list" aria-label="Obiettivi">
            {goals.map((goal) => (
              <div
                className={`note-line ${goal.completed ? "is-done" : ""}`}
                role="listitem"
                key={goal.id}
              >
                <button
                  className="note-check"
                  type="button"
                  aria-label={
                    goal.completed
                      ? `Riattiva ${goal.title}`
                      : `Completa ${goal.title}`
                  }
                  aria-pressed={goal.completed}
                  onClick={() => toggleGoal(goal.id)}
                >
                  {goal.completed && <Check size={14} strokeWidth={3} />}
                </button>
                <textarea
                  className="note-input"
                  aria-label="Obiettivo"
                  rows={1}
                  value={titleFor(goal)}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [goal.id]: event.target.value,
                    }))
                  }
                  onBlur={() => saveTitle(goal)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  }}
                />
                <button
                  className="note-delete"
                  type="button"
                  aria-label={`Elimina ${goal.title}`}
                  onClick={() => deleteGoal(goal.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <div className="note-line new-note" role="listitem">
              <span
                className="note-check note-check-placeholder"
                aria-hidden="true"
              />
              <textarea
                className="note-input"
                aria-label="Nuovo obiettivo"
                placeholder="Inizia a scrivere…"
                rows={1}
                value={newDraft}
                onChange={(event) => setNewDraft(event.target.value)}
                onBlur={addNewGoal}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                }}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="notes-empty">
          <p>
            {!state.areas.length
              ? "Crea una prima area per iniziare a scrivere."
              : "Crea una tappa per iniziare a scrivere."}
          </p>
          <button type="button" onClick={onSettings}>
            Apri impostazioni
          </button>
        </div>
      )}

      {state.areas.length > 1 && (
        <div className="area-switcher" aria-label="Seleziona area">
          {state.areas.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === area?.id ? "is-active" : ""}
              onClick={() => selectArea(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
