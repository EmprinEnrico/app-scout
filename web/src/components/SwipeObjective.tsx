// Swipe objective: reveals a delete action for the whole objective card.
import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

const DELETE_REVEAL_WIDTH = 88;
const SWIPE_THRESHOLD = 42;

export function SwipeObjective({
  name,
  onDelete,
  children,
}: {
  name: string;
  onDelete: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const dragging = useRef(false);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button,input,textarea")) return;
    dragging.current = true;
    startX.current = event.clientX;
    startOffset.current = open ? -DELETE_REVEAL_WIDTH : 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const next = startOffset.current + event.clientX - startX.current;
    setOffset(Math.max(-DELETE_REVEAL_WIDTH, Math.min(0, next)));
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    dragging.current = false;
    const distance = event.clientX - startX.current;
    if (distance < -SWIPE_THRESHOLD) {
      if (open) onDelete();
      else setOpen(true);
    } else if (distance > SWIPE_THRESHOLD && open) {
      setOpen(false);
    }
    setOffset(0);
  }

  return (
    <article className="swipe-objective">
      <div className="swipe-objective-actions">
        <button
          className="swipe-objective-delete"
          type="button"
          aria-label={`Elimina ${name}`}
          onClick={onDelete}
        >
          <Trash2 size={16} />
          <span>Elimina</span>
        </button>
      </div>
      <div
        className="swipe-objective-content"
        style={{ transform: `translateX(${open ? -DELETE_REVEAL_WIDTH : offset}px)` }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        {children}
      </div>
    </article>
  );
}
