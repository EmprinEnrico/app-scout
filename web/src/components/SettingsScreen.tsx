import { useState } from 'react'
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, Check, Flag, FolderOpen, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { useGoals } from '../domain/GoalsContext'

type Renaming = { kind: 'area' | 'stage'; id: string; value: string }

export function SettingsScreen() {
  const { state, legacyDataAvailable, addArea, renameArea, deleteArea, addStage, renameStage, deleteStage, exportData, importData, importLegacyData, resetData } = useGoals()
  const [newArea, setNewArea] = useState('')
  const [newStage, setNewStage] = useState('')
  const [managedAreaId, setManagedAreaId] = useState('')
  const [renaming, setRenaming] = useState<Renaming | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const managedArea = state.areas.find(item => item.id === managedAreaId) ?? state.areas.find(item => item.id === state.selectedAreaId) ?? state.areas[0]
  const managedStages = state.stages.filter(item => item.areaId === managedArea?.id).sort((a, b) => a.position - b.position)

  function saveRename() {
    if (!renaming?.value.trim()) return
    if (renaming.kind === 'area') renameArea(renaming.id, renaming.value.trim())
    else renameStage(renaming.id, renaming.value.trim())
    setRenaming(null)
  }

  function download() {
    const url = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `scout-journey-dati-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function upload(file?: File) {
    if (!file || !window.confirm('Importare questo file? Le aree, le tappe e gli obiettivi attuali saranno sostituiti.')) return
    try {
      const result = importData(await file.text())
      setMessage({ ok: result.ok, text: result.message })
    } catch {
      setMessage({ ok: false, text: 'Non siamo riusciti a leggere questo file. Riprova con un file JSON di Scout Journey.' })
    }
  }

  return <>
    <div className="page-intro"><span className="eyebrow"><span className="tiny-sun" /> FAI SPAZIO A CIÒ CHE CONTA</span><h1>Impostazioni<span className="accent-period">.</span></h1><p>Organizza il tuo spazio e tieni i tuoi dati con te.</p></div>
    <div className="settings-grid">
      <section className="settings-panel" aria-labelledby="manage-areas-title">
        <div className="panel-heading"><span className="panel-icon"><FolderOpen size={20} /></span><div><h2 id="manage-areas-title">Le tue aree</h2><p>I grandi temi del tuo percorso.</p></div></div>
        <ul className="manage-list">{state.areas.map(area => <li key={area.id}>
          {renaming?.kind === 'area' && renaming.id === area.id ? <form className="rename-form" onSubmit={event => { event.preventDefault(); saveRename() }}>
            <input autoFocus required aria-label="Nuovo nome dell'area" value={renaming.value} onChange={event => setRenaming({ ...renaming, value: event.target.value })} />
            <button className="icon-button" type="submit" aria-label="Salva nome"><Check size={18} /></button>
            <button className="icon-button" type="button" aria-label="Annulla modifica" onClick={() => setRenaming(null)}><X size={18} /></button>
          </form> : <>
            <span className="area-dot" style={{ backgroundColor: area.color }} aria-hidden="true" />
            <strong>{area.name}</strong>
            <button className="icon-button" type="button" aria-label={`Rinomina ${area.name}`} onClick={() => setRenaming({ kind: 'area', id: area.id, value: area.name })}><Pencil size={16} /></button>
            <button className="icon-button danger-hover" type="button" aria-label={`Elimina ${area.name}`} onClick={() => { if (window.confirm(`Eliminare “${area.name}” e tutte le sue tappe e obiettivi? Questa azione non si può annullare.`)) deleteArea(area.id) }}><Trash2 size={16} /></button>
          </>}
        </li>)}</ul>
        {!state.areas.length && <p className="inline-empty">Nessuna area ancora. Aggiungine una qui sotto.</p>}
        <form className="add-form" onSubmit={event => { event.preventDefault(); if (newArea.trim()) { addArea(newArea.trim()); setNewArea('') } }}>
          <input aria-label="Nome della nuova area" placeholder="Nome della nuova area" maxLength={60} required value={newArea} onChange={event => setNewArea(event.target.value)} />
          <button type="submit" className="button button-secondary"><Plus size={17} /> Aggiungi</button>
        </form>
      </section>

      <section className="settings-panel" aria-labelledby="manage-stages-title">
        <div className="panel-heading"><span className="panel-icon"><Flag size={20} /></span><div><h2 id="manage-stages-title">Le tappe</h2><p>Dividi il cammino in passi più piccoli.</p></div></div>
        {managedArea ? <>
          <label className="field compact-field"><span>Area da organizzare</span><select value={managedArea.id} onChange={event => setManagedAreaId(event.target.value)}>{state.areas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}</select></label>
          <ul className="manage-list stage-manage-list">{managedStages.map((stage, index) => <li key={stage.id}>
            {renaming?.kind === 'stage' && renaming.id === stage.id ? <form className="rename-form" onSubmit={event => { event.preventDefault(); saveRename() }}>
              <input autoFocus required aria-label="Nuovo nome della tappa" value={renaming.value} onChange={event => setRenaming({ ...renaming, value: event.target.value })} />
              <button className="icon-button" type="submit" aria-label="Salva nome"><Check size={18} /></button>
              <button className="icon-button" type="button" aria-label="Annulla modifica" onClick={() => setRenaming(null)}><X size={18} /></button>
            </form> : <>
              <span className="manage-number">{String(index + 1).padStart(2, '0')}</span>
              <strong>{stage.name}</strong>
              <button className="icon-button" type="button" aria-label={`Rinomina ${stage.name}`} onClick={() => setRenaming({ kind: 'stage', id: stage.id, value: stage.name })}><Pencil size={16} /></button>
              <button className="icon-button danger-hover" type="button" aria-label={`Elimina ${stage.name}`} onClick={() => { if (window.confirm(`Eliminare la tappa “${stage.name}”? Gli obiettivi saranno spostati in un’altra tappa.`)) deleteStage(stage.id) }}><Trash2 size={16} /></button>
            </>}
          </li>)}</ul>
          {!managedStages.length && <p className="inline-empty">Nessuna tappa in quest’area. Crea la prima.</p>}
          <form className="add-form" onSubmit={event => { event.preventDefault(); if (newStage.trim()) { addStage(managedArea.id, newStage.trim()); setNewStage('') } }}>
            <input aria-label="Nome della nuova tappa" placeholder="Nome della nuova tappa" maxLength={60} required value={newStage} onChange={event => setNewStage(event.target.value)} />
            <button type="submit" className="button button-secondary"><Plus size={17} /> Aggiungi</button>
          </form>
        </> : <p className="inline-empty">Crea prima un’area per aggiungere le tappe.</p>}
      </section>
    </div>

    <section className="settings-panel data-panel" aria-labelledby="data-title">
      <div className="panel-heading"><span className="panel-icon"><ArrowDownToLine size={20} /></span><div><h2 id="data-title">I tuoi dati</h2><p>Una copia dei tuoi obiettivi, quando vuoi.</p></div></div>
      <div className="data-actions"><div><strong>Esporta i dati</strong><p>Scarica una copia in formato JSON.</p></div><button type="button" className="button button-secondary" onClick={download}><ArrowDownToLine size={17} /> Esporta</button></div>
      <div className="data-actions"><div><strong>Importa i dati</strong><p>Carica un file JSON esportato da Scout Journey. Sostituirà i dati attuali.</p></div><label className="button button-secondary file-button"><ArrowUpFromLine size={17} /> Importa<input type="file" accept="application/json,.json" aria-label="Importa dati da un file JSON" onChange={event => { void upload(event.target.files?.[0]); event.target.value = '' }} /></label></div>
      {legacyDataAvailable && <div className="data-actions legacy-action"><div><strong>Dalla vecchia app</strong><p>Importa gli obiettivi in una nuova area. I dati della vecchia app restano conservati.</p></div><button type="button" className="text-link" onClick={() => {
        if (window.confirm('Importare gli obiettivi dalla vecchia app in una nuova area di Scout Journey? I dati della vecchia app resteranno conservati.')) {
          const result = importLegacyData()
          setMessage({ ok: result.ok, text: result.message })
        }
      }}>Importa obiettivi dalla vecchia app <ArrowRight size={16} /></button></div>}
      {message && <p className={`import-message ${message.ok ? 'success' : 'failure'}`} role="status">{message.text}</p>}
      <div className="data-actions reset-action"><div><strong>Ricomincia da zero</strong><p>Elimina aree, tappe e obiettivi salvati.</p></div><button type="button" className="button button-danger" onClick={() => {
        if (window.confirm('Vuoi eliminare tutti i tuoi dati di Scout Journey? Questa azione non si può annullare.')) {
          resetData()
          setMessage(null)
        }
      }}><RotateCcw size={17} /> Reimposta</button></div>
    </section>
  </>
}
