import { useState } from 'react'
import { ArrowRight, Check, ChevronLeft, ChevronRight, Flag, FolderOpen, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useGoals } from '../domain/GoalsContext'
import type { Goal } from '../domain/contracts'
import { GoalDialog, type GoalDraft } from './GoalDialog'
import { count } from './format'
import { Progress } from './ui'

export function GoalsScreen({ onJourney, onSettings }: { onJourney: () => void; onSettings: () => void }) {
  const { state, addGoal, updateGoal, toggleGoal, deleteGoal, selectArea, selectStage } = useGoals()
  const [editing, setEditing] = useState<Goal | 'new' | null>(null)
  const area = state.areas.find(item => item.id === state.selectedAreaId) ?? state.areas[0]
  const stages = state.stages.filter(item => item.areaId === area?.id).sort((a, b) => a.position - b.position)
  const stage = stages.find(item => item.id === state.selectedStageId) ?? stages[0]
  const stageIndex = stages.findIndex(item => item.id === stage?.id)
  const goals = state.goals.filter(item => item.areaId === area?.id && item.stageId === stage?.id)
  const done = goals.filter(item => item.completed).length
  const totalDone = state.goals.filter(item => item.completed).length

  function saveGoal(draft: GoalDraft) {
    if (editing === 'new') addGoal(draft)
    else if (editing) updateGoal(editing.id, draft)
    setEditing(null)
  }

  return <>
    <div className="page-intro"><span className="eyebrow"><span className="tiny-sun" /> IL TUO SPAZIO, AL TUO RITMO</span><h1>Un passo alla volta<span className="accent-period">.</span></h1><p>I tuoi obiettivi, organizzati nel modo che ha senso per te.</p></div>
    <section className="overview-card" aria-label="Riepilogo dei progressi">
      <div className="overview-copy"><span className="overview-kicker"><Sparkles size={15} /> IL TUO PERCORSO</span><h2>Ogni piccolo passo<br />fa strada.</h2><p>{state.goals.length ? 'Continua da dove sei. Il prossimo passo è già qui.' : 'Inizia scegliendo ciò che conta per te.'}</p><button className="text-link light-link" type="button" onClick={onJourney}>Guarda il percorso <ArrowRight size={16} /></button></div>
      <div className="overview-metric"><div className="ring" style={{ background: `conic-gradient(#d7e897 ${state.goals.length ? totalDone / state.goals.length * 100 : 0}%, #426553 0)` }}><span><strong>{totalDone}</strong><small>di {state.goals.length}</small></span></div><span>obiettivi completati</span></div>
      <span className="overview-glow" aria-hidden="true" />
    </section>

    <section className="content-section" aria-labelledby="areas-title">
      <div className="section-heading"><div><span className="eyebrow">METTI A FUOCO</span><h2 id="areas-title">Le tue aree</h2></div><button type="button" className="text-link" onClick={onSettings}>Gestisci aree <ArrowRight size={16} /></button></div>
      {state.areas.length ? <div className="area-list" role="group" aria-label="Seleziona un'area">{state.areas.map(item => {
        const areaGoals = state.goals.filter(goal => goal.areaId === item.id)
        return <button key={item.id} type="button" className={`area-pill ${area?.id === item.id ? 'is-active' : ''}`} aria-pressed={area?.id === item.id} onClick={() => selectArea(item.id)}>
          <span className="area-dot" style={{ backgroundColor: item.color }} aria-hidden="true" />
          <span>{item.name}</span><small>{areaGoals.filter(goal => goal.completed).length}/{areaGoals.length}</small>
        </button>
      })}</div> : <div className="empty-card first-empty"><span className="empty-icon"><FolderOpen size={26} /></span><h3>Da dove vuoi iniziare?</h3><p>Crea un’area per raccogliere gli obiettivi che ti stanno a cuore.</p><button type="button" className="button button-primary" onClick={onSettings}><Plus size={17} /> Crea un’area</button></div>}
    </section>

    {area && <section className="content-section stage-section" aria-labelledby="stage-section-title">
      <div className="section-heading"><div><span className="eyebrow">UN PASSO PER VOLTA</span><h2 id="stage-section-title">Le tappe</h2></div><span className="muted-count">{count(stages.length, 'tappa', 'tappe')}</span></div>
      {stage ? <>
        <div className="stage-card">
          <div className="stage-topline"><span className="stage-number">TAPPA {stageIndex + 1} <span>/ {stages.length}</span></span><div className="stage-arrows">
            <button type="button" aria-label="Tappa precedente" disabled={stageIndex <= 0} onClick={() => { const previous = stages[stageIndex - 1]; if (previous) selectStage(previous.id) }}><ChevronLeft size={20} /></button>
            <button type="button" aria-label="Tappa successiva" disabled={stageIndex >= stages.length - 1} onClick={() => { const next = stages[stageIndex + 1]; if (next) selectStage(next.id) }}><ChevronRight size={20} /></button>
          </div></div>
          <h3>{stage.name}</h3>
          <div className="stage-progress-line"><span>{count(done, 'obiettivo completato', 'obiettivi completati')} su {goals.length}</span><span>{goals.length ? Math.round(done / goals.length * 100) : 0}%</span></div>
          <Progress done={done} total={goals.length} />
        </div>
        <div className="section-heading goals-heading"><div><span className="eyebrow">COSE DA FARE</span><h2>I tuoi obiettivi</h2></div><button type="button" className="button button-primary add-goal" onClick={() => setEditing('new')}><Plus size={18} /> Aggiungi obiettivo</button></div>
        {goals.length ? <ul className="goal-list">{goals.map(goal => <li className={`goal-row ${goal.completed ? 'is-done' : ''}`} key={goal.id}>
          <button className="goal-check" type="button" aria-label={`${goal.completed ? 'Segna da fare' : 'Segna come completato'}: ${goal.title}`} aria-pressed={goal.completed} onClick={() => toggleGoal(goal.id)}>{goal.completed && <Check size={16} strokeWidth={3} />}</button>
          <div className="goal-text"><strong>{goal.title}</strong>{goal.note && <p>{goal.note}</p>}</div>
          <div className="goal-actions"><button className="icon-button" type="button" aria-label={`Modifica ${goal.title}`} onClick={() => setEditing(goal)}><Pencil size={17} /></button><button className="icon-button danger-hover" type="button" aria-label={`Elimina ${goal.title}`} onClick={() => { if (window.confirm(`Eliminare “${goal.title}”? Questa azione non si può annullare.`)) deleteGoal(goal.id) }}><Trash2 size={17} /></button></div>
        </li>)}</ul> : <div className="empty-card goals-empty"><span className="empty-icon"><Flag size={25} /></span><h3>Uno spazio per i tuoi prossimi passi</h3><p>Questa tappa è pronta. Aggiungi il primo obiettivo quando vuoi.</p><button type="button" className="text-link" onClick={() => setEditing('new')}>Aggiungi un obiettivo <ArrowRight size={16} /></button></div>}
      </> : <div className="empty-card"><span className="empty-icon"><Flag size={25} /></span><h3>Ogni percorso inizia con una tappa</h3><p>Organizza quest’area in tappe, poi aggiungi i tuoi obiettivi.</p><button type="button" className="button button-primary" onClick={onSettings}><Plus size={17} /> Crea una tappa</button></div>}
    </section>}

    {editing && <GoalDialog key={editing === 'new' ? 'new' : editing.id}
      initial={editing === 'new' ? { title: '', note: '', areaId: area?.id ?? '', stageId: stage?.id ?? '' } : { title: editing.title, note: editing.note, areaId: editing.areaId, stageId: editing.stageId }}
      areas={state.areas} stages={state.stages} onSave={saveGoal} onClose={() => setEditing(null)} />}
  </>
}
