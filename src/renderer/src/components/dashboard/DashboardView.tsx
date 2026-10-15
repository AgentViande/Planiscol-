import React from 'react'
import {
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react'
import { useTaskStore } from '../../stores/useTaskStore'
import { useSubjectStore } from '../../stores/useSubjectStore'
import { useGradeStore } from '../../stores/useGradeStore'
import { Task } from '../../types'

interface DashboardViewProps {
  onNavigateToTab: (tab: 'todo' | 'calendar' | 'subjects' | 'grades') => void
  onOpenQuickAdd: () => void
  onSelectTask: (taskId: string) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTab,
  onOpenQuickAdd,
  onSelectTask
}) => {
  const { tasks, toggleTaskStatus } = useTaskStore()
  const { getSubjectById } = useSubjectStore()
  const { getOverallAverage } = useGradeStore()

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  // Calcul des tâches
  const activeTasks = tasks.filter((t) => !t.isArchived)
  const todayStr = now.toISOString().split('T')[0]

  const overdueTasks = activeTasks.filter((t) => {
    if (t.status === 'done' || !t.dueDate) return false
    return t.dueDate.split('T')[0] < todayStr
  })

  const todayTasks = activeTasks.filter((t) => {
    if (!t.dueDate) return false
    return t.dueDate.split('T')[0] === todayStr
  })

  const doneThisWeek = tasks.filter((t) => {
    if (t.status !== 'done') return false
    const updated = new Date(t.updatedAt)
    const diffDays = (now.getTime() - updated.getTime()) / (1000 * 3600 * 24)
    return diffDays <= 7
  })

  const totalThisWeek = activeTasks.length + doneThisWeek.length
  const weeklyPercentage =
    totalThisWeek > 0 ? Math.round((doneThisWeek.length / totalThisWeek) * 100) : 100

  // Prochain contrôle majeur
  const nextExam = activeTasks
    .filter((t) => (t.type === 'controle' || t.type === 'projet') && t.status !== 'done' && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]

  const getExamCountdown = (dueDateStr?: string): { days: number; text: string } => {
    if (!dueDateStr) return { days: 0, text: '' }
    const due = new Date(dueDateStr)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return { days: 0, text: "Aujourd'hui !" }
    if (diffDays === 1) return { days: 1, text: 'Demain' }
    return { days: diffDays, text: `Dans ${diffDays} jours` }
  }

  const overallAvg = getOverallAverage()

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header Greeting & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{greeting}</span>
            <span className="text-accent animate-pulse">✨</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {now.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-all shadow-glow hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ajout rapide</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tâches du jour */}
        <div
          onClick={() => onNavigateToTab('todo')}
          className="glass-panel p-4 rounded-2xl cursor-pointer hover:border-white/20 transition-all hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pour aujourd'hui</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-display">{todayTasks.length}</span>
            <span className="text-xs text-slate-400">devoirs à rendre</span>
          </div>
        </div>

        {/* En retard */}
        <div
          onClick={() => onNavigateToTab('todo')}
          className="glass-panel p-4 rounded-2xl cursor-pointer hover:border-white/20 transition-all hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">En retard</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-400 font-display">
              {overdueTasks.length}
            </span>
            <span className="text-xs text-slate-400">tâches urgentes</span>
          </div>
        </div>

        {/* Progression de la semaine */}
        <div className="glass-panel p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Progression semaine</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white font-display">
                {weeklyPercentage}%
              </span>
              <span className="text-xs text-slate-400">{doneThisWeek.length} terminées</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${weeklyPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Moyenne générale */}
        <div
          onClick={() => onNavigateToTab('grades')}
          className="glass-panel p-4 rounded-2xl cursor-pointer hover:border-white/20 transition-all hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Moyenne générale</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-300 font-display">
              {overallAvg !== null ? `${overallAvg}/20` : '—'}
            </span>
            <span className="text-xs text-slate-400">pondérée</span>
          </div>
        </div>
      </div>

      {/* Grid: Prochain Contrôle + Tâches Urgentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Major Exam Banner */}
        <div className="glass-panel-elevated p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between border-indigo-500/20 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>Prochaine Échéance Majeure</span>
            </div>

            {nextExam ? (
              <div className="mt-4 space-y-3">
                <div className="inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold">
                  {getExamCountdown(nextExam.dueDate).text}
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">{nextExam.title}</h3>
                {nextExam.subjectId && (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: getSubjectById(nextExam.subjectId)?.color }}
                    />
                    <span className="text-xs text-slate-300 font-medium">
                      {getSubjectById(nextExam.subjectId)?.name}
                    </span>
                  </div>
                )}
                {nextExam.dueDate && (
                  <p className="text-xs text-slate-400">
                    Date :{' '}
                    {new Date(nextExam.dueDate).toLocaleString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-6 text-center py-6">
                <p className="text-slate-400 text-sm">Aucun contrôle programmé prochainement.</p>
                <p className="text-slate-500 text-xs mt-1">Profitez-en pour réviser ou avancer !</p>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateToTab('calendar')}
            className="mt-6 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors border border-white/5"
          >
            <span>Consulter l'agenda complet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tâches du Jour et Prioritaires */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                <span>À faire aujourd'hui</span>
                <span className="text-xs font-normal text-slate-400">({todayTasks.length})</span>
              </h2>
              <button
                onClick={() => onNavigateToTab('todo')}
                className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
              >
                <span>Voir tout</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-400 text-sm">Toutes vos tâches du jour sont bouclées !</p>
                <p className="text-slate-500 text-xs mt-1">Ajoutez-en une avec Ctrl+Space.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map((task: Task) => {
                  const subject = getSubjectById(task.subjectId)
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            task.status === 'done'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-600 hover:border-accent'
                          }`}
                        >
                          {task.status === 'done' && '✓'}
                        </button>
                        <div
                          onClick={() => onSelectTask(task.id)}
                          className="cursor-pointer min-w-0"
                        >
                          <p
                            className={`text-sm font-medium truncate ${
                              task.status === 'done'
                                ? 'line-through text-slate-500'
                                : 'text-slate-200'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {subject && (
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: `${subject.color}25`,
                                  color: subject.color
                                }}
                              >
                                {subject.name}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              {task.estimatedDuration ? `${task.estimatedDuration} min` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            task.priority === 'high'
                              ? 'bg-red-500 shadow-glow'
                              : task.priority === 'medium'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          title={`Priorité ${task.priority}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
