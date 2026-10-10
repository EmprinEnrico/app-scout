// Stages settings panel: creates, renames, and removes stages for an area.
import { Check, Flag, Pencil, Plus, Trash2, X } from "lucide-react";
import type { StagesPanelProps } from "./types";

export function StagesPanel({
  areas, managedArea, managedStages, setManagedAreaId, newStage, setNewStage,
  addStage, deleteStage, renaming, setRenaming, saveRename,
}: StagesPanelProps) {
  return (
    <section className="settings-panel" aria-labelledby="manage-stages-title">
      <div className="panel-heading">
        <span className="panel-icon"><Flag size={20} /></span>
        <div>
          <h2 id="manage-stages-title">Le tappe</h2>
          <p>Dividi il cammino in passi più piccoli.</p>
        </div>
      </div>
      {managedArea ? (
        <>
          <label className="field compact-field">
            <span>Area da organizzare</span>
            <select
              value={managedArea.id}
              onChange={(event) => setManagedAreaId(event.target.value)}
            >
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </label>
          <ul className="manage-list stage-manage-list">
            {managedStages.map((stage) => (
              <li key={stage.id}>
                {renaming?.kind === "stage" && renaming.id === stage.id ? (
                  <form className="rename-form" onSubmit={(event) => {
                    event.preventDefault();
                    saveRename();
                  }}>
                    <input
                      autoFocus
                      required
                      aria-label="Nuovo nome della tappa"
                      value={renaming.value}
                      onChange={(event) => setRenaming({
                        ...renaming, value: event.target.value,
                      })}
                    />
                    <button className="icon-button" type="submit" aria-label="Salva nome">
                      <Check size={18} />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label="Annulla modifica"
                      onClick={() => setRenaming(null)}
                    >
                      <X size={18} />
                    </button>
                  </form>
                ) : (
                  <>
                    <strong>{stage.name}</strong>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Rinomina ${stage.name}`}
                      onClick={() => setRenaming({
                        kind: "stage", id: stage.id, value: stage.name,
                      })}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button danger-hover"
                      type="button"
                      aria-label={`Elimina ${stage.name}`}
                      onClick={() => {
                        if (window.confirm(
                          `Eliminare la tappa “${stage.name}”? ` +
                            "Gli obiettivi saranno spostati in un’altra tappa.",
                        )) deleteStage(stage.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
          {!managedStages.length && (
            <p className="inline-empty">Nessuna tappa in quest’area. Crea la prima.</p>
          )}
          <form className="add-form" onSubmit={(event) => {
            event.preventDefault();
            if (newStage.trim()) {
              addStage(managedArea.id, newStage.trim());
              setNewStage("");
            }
          }}>
            <input
              aria-label="Nome della nuova tappa"
              placeholder="Nome della nuova tappa"
              maxLength={60}
              required
              value={newStage}
              onChange={(event) => setNewStage(event.target.value)}
            />
            <button type="submit" className="button button-secondary">
              <Plus size={17} /> Aggiungi
            </button>
          </form>
        </>
      ) : (
        <p className="inline-empty">Crea prima un’area per aggiungere le tappe.</p>
      )}
    </section>
  );
}
