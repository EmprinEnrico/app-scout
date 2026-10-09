export function Progress({ done, total }: { done: number; total: number }) {
  return <div className="progress-track" role="progressbar" aria-label="Obiettivi completati" aria-valuemin={0} aria-valuemax={total || 1} aria-valuenow={done}>
    <span style={{ width: `${total ? done / total * 100 : 0}%` }} />
  </div>
}
