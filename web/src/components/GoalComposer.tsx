// Goal composer: adds a concrete practice to a selected milestone.
import { useState, type FormEvent } from "react";
import { Check, Plus, X } from "lucide-react";
import type { Area, Stage } from "../domain/contracts";

export function GoalComposer({
  areas,
  stages,
  onAdd,
}: {
  areas: Area[];
  stages: Stage[];
  onAdd: (title: string, areaId: string, stageId: string) => void;
}) {
  const firstArea = areas[0]?.id ?? "";
  const firstStage = stages.find((stage) => stage.areaId === firstArea)?.id ?? "";
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState(firstArea);
  const [stageId, setStageId] = useState(firstStage);
  const availableStages = stages
    .filter((stage) => stage.areaId === areaId)
    .sort((left, right) => left.position - right.position);
  const validStageId = availableStages.some((stage) => stage.id === stageId)
    ? stageId
    : availableStages[0]?.id ?? "";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !areaId || !validStageId) return;
    onAdd(title.trim(), areaId, validStageId);
    setTitle("");
    setOpen(false);
  }

  if (!areas.length) return null;
  if (!open) {
    return (
      <button className="add-goal-trigger" type="button" onClick={() => setOpen(true)}>
        <Plus size={18} /> Aggiungi goal
      </button>
    );
  }

  return (
    <form className="goal-composer" onSubmit={submit}>
      <textarea
        autoFocus
        rows={2}
        aria-label="Nome del nuovo goal"
        placeholder="Cosa vuoi aggiungere?"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <div className="goal-composer-controls">
        <select
          aria-label="Obiettivo del nuovo goal"
          value={areaId}
          onChange={(event) => setAreaId(event.target.value)}
        >
          {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
        </select>
        <select
          aria-label="Milestone del nuovo goal"
          value={validStageId}
          onChange={(event) => setStageId(event.target.value)}
        >
          {availableStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
        </select>
        <button className="button button-primary" type="submit" disabled={!title.trim()}>
          <Check size={16} /> Aggiungi
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label="Annulla aggiunta goal"
          onClick={() => setOpen(false)}
        >
          <X size={17} />
        </button>
      </div>
    </form>
  );
}
