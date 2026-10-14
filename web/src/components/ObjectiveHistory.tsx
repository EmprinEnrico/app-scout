// Snapshot carousel for reviewing objective history and changes.
import { useState } from "react";
import { diffObjective } from "../domain/objectiveDiff";
import "../ObjectiveHistory.css";

type Version = { id: string; createdAt: string; content: string };

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function ObjectiveHistory({
  areaName,
  versions,
  onBack,
}: {
  areaName: string;
  versions: Version[];
  onBack: () => void;
}) {
  const [index, setIndex] = useState(Math.max(versions.length - 1, 0));
  const version = versions[index];
  const lines = version
    ? diffObjective(versions[index - 1]?.content ?? version.content, version.content)
    : [];
  const move = (amount: number) => setIndex((current) =>
    Math.max(0, Math.min(versions.length - 1, current + amount)),
  );

  return (
    <section className="objective-history" aria-label={`Storia di ${areaName}`}>
      <header className="objective-history-header">
        <button type="button" onClick={onBack} aria-label="Torna al percorso">‹</button>
        <div><span>Storia dell’obiettivo</span><h1>{areaName}</h1></div>
      </header>
      {versions.length === 0 ? (
        <p className="objective-history-empty">Nessuna versione salvata.</p>
      ) : (
        <>
          <nav className="objective-history-controls" aria-label="Navigazione tra le versioni">
            <button type="button" onClick={() => move(-1)} disabled={index === 0}
              aria-label="Versione precedente">‹</button>
            <span>{index + 1} di {versions.length}</span>
            <button type="button" onClick={() => move(1)}
              disabled={index === versions.length - 1} aria-label="Versione successiva">›</button>
          </nav>
          <article className="objective-history-card"
            onTouchStart={(event) => {
              const x = event.touches[0]?.clientX;
              if (x !== undefined) event.currentTarget.dataset.touchX = String(x);
            }}
            onTouchEnd={(event) => {
              const start = Number(event.currentTarget.dataset.touchX);
              const delta = event.changedTouches[0]?.clientX;
              if (delta !== undefined && Math.abs(delta - start) > 45) {
                move(delta < start ? 1 : -1);
              }
            }}>
            <div className="objective-history-date">
              Versione {index + 1} · {formatDate(version!.createdAt)}
            </div>
            <div className="objective-history-document">
              {lines.map((line, lineIndex) => {
                const className = [
                  "objective-history-line",
                  `objective-history-${line.kind}`,
                  line.type !== "same" ? `objective-history-${line.type}` : "",
                ].filter(Boolean).join(" ");
                const text = line.kind === "title" || line.kind === "milestone"
                  ? line.text.replace(/^#\s+/, "")
                  : line.kind === "task" ? line.text.replace(/^\s*-\s+/, "") : line.text;
                return (
                  <div className={className} key={`${lineIndex}-${line.type}-${line.taskId ?? ""}`}>
                    {line.kind === "task" && (
                      <span className={`objective-history-check ${line.completed ? "is-complete" : ""}`}
                        aria-label={line.completed ? "Completata" : "Da completare"}>
                        {line.completed ? "✓" : ""}
                      </span>
                    )}
                    <span>{text || " "}</span>
                  </div>
                );
              })}
            </div>
          </article>
        </>
      )}
    </section>
  );
}
