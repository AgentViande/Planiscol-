import React, { useState } from 'react'
import { Plus, Award, Trash2 } from 'lucide-react'
import { useGradeStore } from '../../stores/useGradeStore'
import { useSubjectStore } from '../../stores/useSubjectStore'
import { Grade } from '../../types'

export const GradesView: React.FC = () => {
  const { grades, saveGrade, deleteGrade, getSubjectAverage, getOverallAverage } = useGradeStore()
  const { subjects } = useSubjectStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '')
  const [title, setTitle] = useState('')
  const [value, setValue] = useState<number>(15)
  const [outOf, setOutOf] = useState<number>(20)
  const [coefficient, setCoefficient] = useState<number>(1)
  const [period, setPeriod] = useState('Trimestre 1')

  const overallAvg = getOverallAverage()

  const handleOpenAdd = (subId?: string): void => {
    setSelectedSubjectId(subId || subjects[0]?.id || '')
    setTitle('')
    setValue(15)
    setOutOf(20)
    setCoefficient(1)
    setPeriod('Trimestre 1')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!title.trim() || !selectedSubjectId) return

    const newGrade: Grade = {
      id: `grade-${Date.now()}`,
      subjectId: selectedSubjectId,
      title: title.trim(),
      value,
      outOf: outOf > 0 ? outOf : 20,
      coefficient: coefficient > 0 ? coefficient : 1,
      date: new Date().toISOString().split('T')[0],
      period
    }

    await saveGrade(newGrade)
    setIsModalOpen(false)
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-5 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">
            Suivi des Notes & Coefficients
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Moyennes pondérées par matière et calcul automatique de la moyenne générale.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une note</span>
        </button>
      </div>

      {/* KPI Overview Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-glow">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Moyenne Générale Pondérée
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-display text-3xl font-extrabold text-white">
                {overallAvg !== null ? `${overallAvg}` : '—'}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 20</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 sm:text-right">
          <p className="font-medium text-slate-300">
            {grades.length} note{grades.length > 1 ? 's' : ''} enregistrée{grades.length > 1 ? 's' : ''}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Calcul basé sur les coefficients configurés</p>
        </div>
      </div>

      {/* Subjects Grades Breakdown */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((sub) => {
            const subGrades = grades.filter((g) => g.subjectId === sub.id)
            const subAvg = getSubjectAverage(sub.id)

            return (
              <div
                key={sub.id}
                className="glass-panel p-4 rounded-2xl border-white/5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  {/* Subject Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{sub.icon || '📖'}</span>
                      <div>
                        <h3 className="font-display font-bold text-sm text-white">{sub.name}</h3>
                        <span className="text-[10px] text-slate-400">
                          Coeff : {sub.coefficient || 1}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className="font-display text-lg font-bold px-2 py-0.5 rounded-lg"
                        style={{
                          backgroundColor: `${sub.color}20`,
                          color: sub.color
                        }}
                      >
                        {subAvg !== null ? `${subAvg}/20` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Grades List */}
                  <div className="mt-3 space-y-1.5">
                    {subGrades.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic py-2">
                        Aucune note pour cette matière.
                      </p>
                    ) : (
                      subGrades.map((g) => (
                        <div
                          key={g.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-200 truncate">{g.title}</p>
                            <p className="text-[10px] text-slate-400">
                              Coeff {g.coefficient} • {g.period}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {g.value}/{g.outOf}
                            </span>
                            <button
                              onClick={() => deleteGrade(g.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400"
                              title="Supprimer la note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Grade for this subject */}
                <button
                  onClick={() => handleOpenAdd(sub.id)}
                  className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium text-slate-300 transition-colors border border-white/5"
                >
                  + Ajouter une note en {sub.name}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Grade Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel-elevated w-full max-w-md rounded-2xl p-6 shadow-2xl border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="font-display text-lg font-bold text-white mb-4">
              Enregistrer une note
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Matière</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Coeff {s.coefficient || 1})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Intitulé de l'évaluation
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex : DS n°2 - Géométrie"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Note</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    required
                    value={value}
                    onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sur</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={outOf}
                    onChange={(e) => setOutOf(parseFloat(e.target.value) || 20)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Coefficient
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={coefficient}
                    onChange={(e) => setCoefficient(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Période</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                >
                  <option value="Trimestre 1">Trimestre 1</option>
                  <option value="Trimestre 2">Trimestre 2</option>
                  <option value="Trimestre 3">Trimestre 3</option>
                  <option value="Semestre 1">Semestre 1</option>
                  <option value="Semestre 2">Semestre 2</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-white/5"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold"
                >
                  Ajouter la note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
