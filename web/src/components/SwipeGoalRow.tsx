// Swipe goal row: edits a concrete practice and reveals its delete action.
import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { Check, Circle, Trash2 } from "lucide-react";
import type { Goal } from "../domain/contracts";

const DELETE_REVEAL_WIDTH = 88;
const SWIPE_THRESHOLD = 42;

export function SwipeGoalRow({
  goal,
  onToggle,
  onUpdate,
  onDelete,
}: {
  goal: Goal;
  onToggle: () => void;
  onUpdate: (title: string) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(goal.title);
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const dragging = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [title]);

  function changeTitle(value: string) {
    setTitle(value);
    if (value.trim()) onUpdate(value);
    else onDelete();
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button")) return;
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
    <li className={`swipe-goal ${open ? "is-open" : ""}`}>
      <div className="swipe-goal-actions">
        <button
          className="swipe-goal-delete"
          type="button"
          aria-label={`Elimina ${goal.title}`}
          onClick={onDelete}
        >
          <Trash2 size={16} />
          <span>Elimina</span>
        </button>
      </div>
      <div
        className="swipe-goal-content"
        style={{ transform: `translateX(${open ? -DELETE_REVEAL_WIDTH : offset}px)` }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <button
          className="task-check"
          type="button"
          aria-label={goal.completed ? `Riattiva ${goal.title}` : `Completa ${goal.title}`}
          aria-pressed={goal.completed}
          onClick={onToggle}
        >
          {goal.completed ? <Check size={14} strokeWidth={3} /> : <Circle size={14} />}
        </button>
        <textarea
          ref={inputRef}
          className={`task-title ${goal.completed ? "is-complete" : ""}`}
          aria-label="Testo della pratica"
          rows={1}
          value={title}
          onChange={(event) => changeTitle(event.target.value)}
        />
      </div>
    </li>
  );
}
