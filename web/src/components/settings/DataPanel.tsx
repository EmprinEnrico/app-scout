// Data settings panel: exports, imports, migrates, and resets local app data.
import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

type DataPanelProps = {
  legacyDataAvailable: boolean;
  exportData: () => string;
  importData: (json: string) => { ok: boolean; message: string };
  importLegacyData: () => { ok: boolean; message: string };
  resetData: () => void;
};

export function DataPanel({
  legacyDataAvailable, exportData, importData, importLegacyData, resetData,
}: DataPanelProps) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function download() {
    const url = URL.createObjectURL(
      new Blob([exportData()], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `scout-journey-dati-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function upload(file?: File) {
    if (!file || !window.confirm(
      "Importare questo file? Gli obiettivi, i milestone e le pratiche attuali saranno sostituiti.",
    )) return;
    try {
      const result = importData(await file.text());
      setMessage({ ok: result.ok, text: result.message });
    } catch {
      setMessage({
        ok: false,
        text: "Non siamo riusciti a leggere questo file. Riprova con un file JSON di Scout Journey.",
      });
    }
  }

  return (
    <section className="settings-panel data-panel" aria-labelledby="data-title">
      <div className="panel-heading">
        <span className="panel-icon"><ArrowDownToLine size={20} /></span>
        <div>
          <h2 id="data-title">I tuoi dati</h2>
          <p>Una copia dei tuoi obiettivi, quando vuoi.</p>
        </div>
      </div>
      <div className="data-actions">
        <div><strong>Esporta i dati</strong><p>Scarica una copia in formato JSON.</p></div>
        <button type="button" className="button button-secondary" onClick={download}>
          <ArrowDownToLine size={17} /> Esporta
        </button>
      </div>
      <div className="data-actions">
        <div>
          <strong>Importa i dati</strong>
          <p>Carica un file JSON esportato da Scout Journey. Sostituirà i dati attuali.</p>
        </div>
        <label className="button button-secondary file-button">
          <ArrowUpFromLine size={17} /> Importa
          <input
            type="file"
            accept="application/json,.json"
            aria-label="Importa dati da un file JSON"
            onChange={(event) => {
              void upload(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      {legacyDataAvailable && (
        <div className="data-actions legacy-action">
          <div>
            <strong>Dalla vecchia app</strong>
            <p>Importa i dati nella nuova struttura. La copia precedente resta conservata.</p>
          </div>
          <button type="button" className="text-link" onClick={() => {
            if (window.confirm(
              "Importare gli obiettivi dalla vecchia app in una nuova area di " +
                "Scout Journey? I dati della vecchia app resteranno conservati.",
            )) {
              const result = importLegacyData();
              setMessage({ ok: result.ok, text: result.message });
            }
          }}>
            Importa obiettivi dalla vecchia app <ArrowRight size={16} />
          </button>
        </div>
      )}
      {message && (
        <p className={`import-message ${message.ok ? "success" : "failure"}`} role="status">
          {message.text}
        </p>
      )}
      <div className="data-actions">
        <div>
          <strong>Codice del progetto</strong>
          <p>Scopri il codice sorgente e contribuisci su GitHub.</p>
        </div>
        <a
          className="button button-secondary"
          href="https://github.com/EmprinEnrico/app-scout"
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={17} /> GitHub
        </a>
      </div>
      <div className="data-actions reset-action">
        <div><strong>Ricomincia da zero</strong><p>Elimina obiettivi, milestone e pratiche salvati.</p></div>
        <button type="button" className="button button-danger" onClick={() => {
          if (window.confirm(
            "Vuoi eliminare tutti i tuoi dati di Scout Journey? Questa azione non si può annullare.",
          )) {
            resetData();
            setMessage(null);
          }
        }}>
          <RotateCcw size={17} /> Reimposta
        </button>
      </div>
    </section>
  );
}
