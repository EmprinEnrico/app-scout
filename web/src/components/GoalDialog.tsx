// Goal dialog: edits a goal and assigns it to an area and stage.
import { useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import type { Area, Stage } from "../domain/contracts";

export type GoalDraft = {
  title: string;
  note: string;
  areaId: string;
  stageId: string;
};

export function GoalDialog({
  initial,
  areas,
  stages,
  onSave,
  onClose,
}: {
  initial: GoalDraft;
  areas: Area[];
  stages: Stage[];
  onSave: (draft: GoalDraft) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(initial);
  const available = stages.filter((stage) => stage.areaId === draft.areaId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="goal-dialog"
      onClose={onClose}
      aria-labelledby="goal-dialog-title"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (draft.title.trim() && draft.stageId)
            onSave({
              ...draft,
              title: draft.title.trim(),
              note: draft.note.trim(),
            });
        }}
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">IL PROSSIMO PASSO</span>
            <h2 id="goal-dialog-title">
              {initial.title ? "Modifica obiettivo" : "Nuovo obiettivo"}
            </h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Chiudi"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <label className="field">
          <span>Che cosa vuoi fare?</span>
          <input
            autoFocus
            required
            maxLength={120}
            placeholder="Scrivi il tuo obiettivo"
            value={draft.title}
            onChange={(event) =>
              setDraft({ ...draft, title: event.target.value })
            }
          />
        </label>
        <label className="field">
          <span>Una nota, se ti va</span>
          <textarea
            rows={3}
            maxLength={1000}
            placeholder="Aggiungi qualche dettaglio utile..."
            value={draft.note}
            onChange={(event) =>
              setDraft({ ...draft, note: event.target.value })
            }
          />
        </label>
        <div className="field-pair">
          <label className="field">
            <span>Area</span>
            <select
              value={draft.areaId}
              onChange={(event) => {
                const areaId = event.target.value;
                setDraft({
                  ...draft,
                  areaId,
                  stageId:
                    stages.find((stage) => stage.areaId === areaId)?.id ?? "",
                });
              }}
            >
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Tappa</span>
            <select
              required
              value={draft.stageId}
              onChange={(event) =>
                setDraft({ ...draft, stageId: event.target.value })
              }
            >
              {available.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="dialog-actions">
          <button
            type="button"
            className="button button-quiet"
            onClick={onClose}
          >
            Annulla
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={!draft.title.trim() || !draft.stageId}
          >
            Salva obiettivo <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </dialog>
  );
}
