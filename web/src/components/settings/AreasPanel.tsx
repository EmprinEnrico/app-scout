// Areas settings panel: creates, renames, and removes goal areas.
import { Check, FolderOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import type { AreasPanelProps } from "./types";

export function AreasPanel({
  areas, newArea, setNewArea, addArea, deleteArea,
  renaming, setRenaming, saveRename,
}: AreasPanelProps) {
  return (
    <section className="settings-panel" aria-labelledby="manage-areas-title">
      <div className="panel-heading">
        <span className="panel-icon"><FolderOpen size={20} /></span>
        <div>
          <h2 id="manage-areas-title">Le tue aree</h2>
          <p>I grandi temi del tuo percorso.</p>
        </div>
      </div>
      <ul className="manage-list">
        {areas.map((area) => (
          <li key={area.id}>
            {renaming?.kind === "area" && renaming.id === area.id ? (
              <form className="rename-form" onSubmit={(event) => {
                event.preventDefault();
                saveRename();
              }}>
                <input
                  autoFocus
                  required
                  aria-label="Nuovo nome dell'area"
                  value={renaming.value}
                  onChange={(event) =>
                    setRenaming({ ...renaming, value: event.target.value })
                  }
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
                <span
                  className="area-dot"
                  style={{ backgroundColor: area.color }}
                  aria-hidden="true"
                />
                <strong>{area.name}</strong>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Rinomina ${area.name}`}
                  onClick={() => setRenaming({
                    kind: "area", id: area.id, value: area.name,
                  })}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button danger-hover"
                  type="button"
                  aria-label={`Elimina ${area.name}`}
                  onClick={() => {
                    if (window.confirm(
                      `Eliminare “${area.name}” e tutte le sue tappe e obiettivi? ` +
                        "Questa azione non si può annullare.",
                    )) deleteArea(area.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {!areas.length && (
        <p className="inline-empty">Nessuna area ancora. Aggiungine una qui sotto.</p>
      )}
      <form className="add-form" onSubmit={(event) => {
        event.preventDefault();
        if (newArea.trim()) {
          addArea(newArea.trim());
          setNewArea("");
        }
      }}>
        <input
          aria-label="Nome della nuova area"
          placeholder="Nome della nuova area"
          maxLength={60}
          required
          value={newArea}
          onChange={(event) => setNewArea(event.target.value)}
        />
        <button type="submit" className="button button-secondary">
          <Plus size={17} /> Aggiungi
        </button>
      </form>
    </section>
  );
}
