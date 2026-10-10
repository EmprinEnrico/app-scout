// Hierarchy editors: reusable inputs for milestones and concrete practices.
import { Plus, Trash2 } from "lucide-react";
import type { Goal, Stage } from "../domain/contracts";

export type Drafts = Record<string, string>;

export function EditableTitle({
  value,
  draft,
  placeholder,
  onChange,
  onSave,
}: {
  value: string;
  draft: string | undefined;
  placeholder: string;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <input
      className="hierarchy-title"
      aria-label={placeholder}
      value={draft ?? value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onSave}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}

function TaskEditor({
  goal,
  draft,
  onChange,
  onSave,
  onDelete,
}: {
  goal: Goal;
  draft: string | undefined;
  onChange: (value: string) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="hierarchy-task">
      <EditableTitle
        value={goal.title}
        draft={draft}
        placeholder="Nome della pratica"
        onChange={onChange}
        onSave={onSave}
      />
      <button
        className="icon-button danger-hover"
        type="button"
        aria-label={`Elimina ${goal.title}`}
        onClick={onDelete}
      >
        <Trash2 size={15} />
      </button>
    </li>
  );
}

export function MilestoneEditor({
  stage,
  goals,
  stageDraft,
  taskDrafts,
  newTask,
  onStageChange,
  onStageSave,
  onTaskChange,
  onTaskSave,
  onTaskDelete,
  onNewTaskChange,
  onAddTask,
  onDeleteStage,
}: {
  stage: Stage;
  goals: Goal[];
  stageDraft: string | undefined;
  taskDrafts: Drafts;
  newTask: string;
  onStageChange: (value: string) => void;
  onStageSave: () => void;
  onTaskChange: (id: string, value: string) => void;
  onTaskSave: (goal: Goal) => void;
  onTaskDelete: (goal: Goal) => void;
  onNewTaskChange: (value: string) => void;
  onAddTask: () => void;
  onDeleteStage: () => void;
}) {
  return (
    <section className="hierarchy-milestone">
      <header className="hierarchy-heading">
        <EditableTitle
          value={stage.name}
          draft={stageDraft}
          placeholder="Nome del milestone"
          onChange={onStageChange}
          onSave={onStageSave}
        />
        <button
          className="icon-button danger-hover"
          type="button"
          aria-label={`Elimina ${stage.name}`}
          onClick={onDeleteStage}
        >
          <Trash2 size={15} />
        </button>
      </header>
      <ul className="hierarchy-task-list">
        {goals.map((goal) => (
          <TaskEditor
            key={goal.id}
            goal={goal}
            draft={taskDrafts[goal.id]}
            onChange={(value) => onTaskChange(goal.id, value)}
            onSave={() => onTaskSave(goal)}
            onDelete={() => onTaskDelete(goal)}
          />
        ))}
      </ul>
      <form className="hierarchy-add" onSubmit={(event) => {
        event.preventDefault();
        onAddTask();
      }}>
        <input
          aria-label={`Aggiungi pratica a ${stage.name}`}
          placeholder="Aggiungi una pratica concreta…"
          value={newTask}
          onChange={(event) => onNewTaskChange(event.target.value)}
        />
        <button className="icon-button" type="submit" aria-label="Aggiungi pratica">
          <Plus size={17} />
        </button>
      </form>
    </section>
  );
}
