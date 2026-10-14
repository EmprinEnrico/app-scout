// Objectives screen: edits each objective as one Markdown-like text document.
import { useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useGoals } from "../domain/GoalsContext";
import type { Area, Goal, ObjectiveBlock, Stage } from "../domain/contracts";
import { ContinuousObjectiveEditor } from "./ContinuousObjectiveEditor";
import "../Hierarchy.css";
import "../Screens.css";

function InlineTitle({
  value,
  label,
  onUpdate,
  onFinish,
}: {
  value: string;
  label: string;
  onUpdate: (value: string) => void;
  onFinish: () => void;
}) {
  const [draft, setDraft] = useState(value);

  function change(nextValue: string) {
    setDraft(nextValue);
    if (nextValue.trim()) onUpdate(nextValue);
  }

  function restoreIfEmpty() {
    if (!draft.trim()) setDraft(value);
    else onFinish();
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
  onReplaceObjective,
  onRecordVersion,
}: {
  area: Area;
  stages: Stage[];
  goals: Goal[];
  onRenameArea: (id: string, name: string) => void;
  onDeleteArea: (id: string) => void;
  onReplaceObjective: (areaId: string, blocks: ObjectiveBlock[]) => void;
  onRecordVersion: (areaId: string, reason?: 'edit' | 'completion') => void;
}) {
  const areaStages = stages.filter((stage) => stage.areaId === area.id);
  const areaGoals = goals.filter((goal) => goal.areaId === area.id);

  function deleteObjective() {
    if (window.confirm(`Eliminare “${area.name}” e tutto il suo contenuto?`)) {
      onDeleteArea(area.id);
    }
  }

  return (
    <div className="hierarchy-objective">
      <header className="hierarchy-objective-heading">
        <span className="area-dot large" />
        <InlineTitle
          value={area.name}
          label="Nome dell’obiettivo"
          onUpdate={(name) => onRenameArea(area.id, name)}
          onFinish={() => onRecordVersion(area.id)}
        />
        <button
          className="icon-button danger-hover"
          type="button"
          aria-label={`Elimina ${area.name}`}
          onClick={deleteObjective}
        >
          <Trash2 size={15} />
        </button>
      </header>
      <ContinuousObjectiveEditor
        stages={areaStages}
        goals={areaGoals}
        onChange={(blocks) => onReplaceObjective(area.id, blocks)}
        onFinish={(reason) => onRecordVersion(area.id, reason)}
      />
    </div>
  );
}

export function ObjectivesScreen() {
  const {
    state,
    addArea,
    renameArea,
    deleteArea,
    replaceObjective,
    recordObjectiveVersion,
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
            onReplaceObjective={replaceObjective}
            onRecordVersion={recordObjectiveVersion}
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
