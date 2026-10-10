// Goal row: inline-edits a concrete task and deletes it when its text is empty.
import { useLayoutEffect, useRef, useState } from "react";
import { Check, Circle } from "lucide-react";
import type { Goal } from "../domain/contracts";

export function GoalRow({
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

  return (
    <li className="simple-goal-row">
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
    </li>
  );
}
