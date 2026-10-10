// Objectives screen: edits objectives, milestones, and their concrete tasks.
import { useState, type Dispatch, type SetStateAction } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useGoals } from "../domain/GoalsContext";
import type { Area, Goal, Stage } from "../domain/contracts";
import "../Hierarchy.css";
import "../Screens.css";
import { EditableTitle, MilestoneEditor, type Drafts } from "./HierarchyEditors";

function clearDraft(setDrafts: Dispatch<SetStateAction<Drafts>>, id: string) {
  setDrafts((drafts) => {
    const next = { ...drafts };
    delete next[id];
    return next;
  });
}


export function ObjectivesScreen() {
  const {
    state,
    addArea,
    renameArea,
    deleteArea,
    addStage,
    renameStage,
    deleteStage,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useGoals();
  const [areaDrafts, setAreaDrafts] = useState<Drafts>({});
  const [stageDrafts, setStageDrafts] = useState<Drafts>({});
  const [taskDrafts, setTaskDrafts] = useState<Drafts>({});
  const [newArea, setNewArea] = useState("");
  const [newStages, setNewStages] = useState<Drafts>({});
  const [newTasks, setNewTasks] = useState<Drafts>({});

  function saveArea(area: Area) {
    const name = areaDrafts[area.id]?.trim();
    clearDraft(setAreaDrafts, area.id);
    if (name && name !== area.name) renameArea(area.id, name);
  }

  function saveStage(stage: Stage) {
    const name = stageDrafts[stage.id]?.trim();
    clearDraft(setStageDrafts, stage.id);
    if (name && name !== stage.name) renameStage(stage.id, name);
  }

  function saveTask(goal: Goal) {
    const draft = taskDrafts[goal.id];
    clearDraft(setTaskDrafts, goal.id);
    if (draft === undefined) return;
    const title = draft.trim();
    if (!title) {
      deleteGoal(goal.id);
      return;
    }
    if (title !== goal.title) updateGoal(goal.id, { title });
  }

  function addObjective() {
    const name = newArea.trim();
    if (!name) return;
    addArea(name);
    setNewArea("");
  }

  function addMilestone(areaId: string) {
    const name = newStages[areaId]?.trim();
    if (!name) return;
    addStage(areaId, name);
    setNewStages((drafts) => ({ ...drafts, [areaId]: "" }));
  }

  function addTask(stage: Stage) {
    const title = newTasks[stage.id]?.trim();
    if (!title) return;
    addGoal({ title, areaId: stage.areaId, stageId: stage.id });
    setNewTasks((drafts) => ({ ...drafts, [stage.id]: "" }));
  }

  return (
    <section className="objectives-page" aria-label="Modifica degli obiettivi">
      <div className="hierarchy-list">
        {state.areas.map((area) => (
          <article className="hierarchy-objective" key={area.id}>
            <header className="hierarchy-objective-heading">
              <span className="area-dot large" style={{ backgroundColor: area.color }} />
              <EditableTitle
                value={area.name}
                draft={areaDrafts[area.id]}
                placeholder="Nome dell’obiettivo"
                onChange={(value) => setAreaDrafts({ ...areaDrafts, [area.id]: value })}
                onSave={() => saveArea(area)}
              />
              <button
                className="icon-button danger-hover"
                type="button"
                aria-label={`Elimina ${area.name}`}
                onClick={() => {
                  if (window.confirm(`Eliminare “${area.name}” e tutto il suo contenuto?`)) {
                    deleteArea(area.id);
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            </header>
            <div className="hierarchy-milestones">
              {state.stages
                .filter((stage) => stage.areaId === area.id)
                .sort((left, right) => left.position - right.position)
                .map((stage) => (
                  <MilestoneEditor
                    key={stage.id}
                    stage={stage}
                    goals={state.goals.filter((goal) => goal.stageId === stage.id)}
                    stageDraft={stageDrafts[stage.id]}
                    taskDrafts={taskDrafts}
                    newTask={newTasks[stage.id] ?? ""}
                    onStageChange={(value) => setStageDrafts({ ...stageDrafts, [stage.id]: value })}
                    onStageSave={() => saveStage(stage)}
                    onTaskChange={(id, value) => setTaskDrafts({ ...taskDrafts, [id]: value })}
                    onTaskSave={saveTask}
                    onNewTaskChange={(value) => setNewTasks({ ...newTasks, [stage.id]: value })}
                    onAddTask={() => addTask(stage)}
                    onDeleteStage={() => {
                      if (window.confirm(
                        `Eliminare “${stage.name}”? Le pratiche saranno spostate nel primo milestone.`,
                      )) {
                        deleteStage(stage.id);
                      }
                    }}
                  />
                ))}
            </div>
            <form className="hierarchy-add milestone-add" onSubmit={(event) => {
              event.preventDefault();
              addMilestone(area.id);
            }}>
              <input
                aria-label={`Aggiungi milestone a ${area.name}`}
                placeholder="Aggiungi un milestone o risultato…"
                value={newStages[area.id] ?? ""}
                onChange={(event) => setNewStages({ ...newStages, [area.id]: event.target.value })}
              />
              <button className="button button-secondary" type="submit">
                <Plus size={16} /> Milestone
              </button>
            </form>
          </article>
        ))}
      </div>
      <form className="new-objective" onSubmit={(event) => {
        event.preventDefault();
        addObjective();
      }}>
        <input
          aria-label="Nome del nuovo obiettivo"
          placeholder="Inizia un nuovo obiettivo…"
          value={newArea}
          onChange={(event) => setNewArea(event.target.value)}
        />
        <button className="button button-primary" type="submit">
          <Pencil size={16} /> Obiettivo
        </button>
      </form>
    </section>
  );
}
