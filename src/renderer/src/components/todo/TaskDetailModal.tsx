import React, { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  Clock,
  Tag,
  Paperclip,
  CheckSquare,
  AlertTriangle,
  FolderOpen,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react'
import { useTaskStore } from '../../stores/useTaskStore'
import { useSubjectStore } from '../../stores/useSubjectStore'
import { Task, TaskType, PriorityLevel, TaskStatus } from '../../types'

interface TaskDetailModalProps {
  taskId: string | null
  isOpen: boolean
  onClose: () => void
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, isOpen, onClose }) => {
  const {
    tasks,
    saveTask,
    deleteTask,
    subtasks,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    attachments,
    addAttachment,
    removeAttachment,
    relocateAttachment
  } = useTaskStore()
  const { subjects } = useSubjectStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState<string>('')
  const [type, setType] = useState<TaskType>('devoir')
  const [priority, setPriority] = useState<PriorityLevel>('medium')
  const [dueDate, setDueDate] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState<number>(30)
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  const task = tasks.find((t) => t.id === taskId)
  const taskSubtasks = taskId ? subtasks[taskId] || [] : []
  const taskAttachments = taskId ? attachments[taskId] || [] : []

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setSubjectId(task.subjectId || '')
      setType(task.type)
      setPriority(task.priority)
      setDueDate(task.dueDate ? task.dueDate.substring(0, 16) : '')
      setEstimatedDuration(task.estimatedDuration || 30)
      setStatus(task.status)
      setTags(task.tags || [])
    } else {
      // New task defaults
      setTitle('')
      setDescription('')
      setSubjectId(subjects[0]?.id || '')
      setType('devoir')
      setPriority('medium')
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(18, 0, 0, 0)
      setDueDate(tomorrow.toISOString().substring(0, 16))
      setEstimatedDuration(30)
      setStatus('todo')
      setTags([])
    }
  }, [task, isOpen, subjects])

  if (!isOpen) return null

  const handleSave = async (): Promise<void> => {
    if (!title.trim()) return

    const newTask: Task = {
      id: taskId || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      description: description.trim(),
      subjectId: subjectId || undefined,
      type,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      estimatedDuration,
      status,
      tags,
      orderIndex: task ? task.orderIndex : tasks.length,
      isArchived: false,
      createdAt: task ? task.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await saveTask(newTask)
    onClose()
  }

  const handleDelete = async (): Promise<void> => {
    if (taskId) {
      await deleteTask(taskId)
      onClose()
    }
  }

  const handleAddTag = (): void => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string): void => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleAddSubtask = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (taskId && newSubtaskTitle.trim()) {
      await addSubtask(taskId, newSubtaskTitle.trim())
      setNewSubtaskTitle('')
    }
  }

  // Sélection de documents locaux sans copie
  const handlePickFiles = async (): Promise<void> => {
    if (!taskId) return
    const picked = await window.api.dialog.pickFiles({
      title: 'Sélectionner des documents de cours ou devoirs'
    })
    if (picked && picked.length > 0) {
      for (const file of picked) {
        await addAttachment(taskId, file.filePath, file.fileName, file.fileType, file.fileSize)
      }
    }
  }

  // Relocalisation si fichier déplacé
  const handleRelocate = async (attachmentId: string): Promise<void> => {
    if (!taskId) return
    const picked = await window.api.dialog.pickFiles({
      title: 'Relocaliser le fichier manquant'
    })
    if (picked && picked.length > 0) {
      await relocateAttachment(taskId, attachmentId, picked[0].filePath)
    }
  }

  // Planificateur de révisions intelligente
  const handleGenerateRevisionPlan = async (): Promise<void> => {
    if (!taskId || !title) return
    const revisionSteps = [
      'J-14 : Découverte et relecture active du cours',
      'J-7 : Fiches de synthèse et mémorisation des formules',
      'J-3 : Entraînement sur exercices types et annales',
      'J-1 : Relecture finale et préparation des affaires'
    ]
    for (const step of revisionSteps) {
      await addSubtask(taskId, step)
    }
  }

  const completedSubsCount = taskSubtasks.filter((s) => s.completed).length
  const progressPercent =
    taskSubtasks.length > 0 ? Math.round((completedSubsCount / taskSubtasks.length) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel-elevated w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border-white/10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-accent">
              {taskId ? 'Détail de la tâche' : 'Nouvelle tâche'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 pr-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Titre de la tâche <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : DM de Géométrie dans l'espace"
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>

          {/* Grid: Matière, Type, Priorité */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Matière */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Matière</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="">(Aucune matière)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent capitalize"
              >
                <option value="devoir">Devoir / Exercices</option>
                <option value="controle">Contrôle / Examen</option>
                <option value="projet">Projet / Dossier</option>
                <option value="expose">Exposé / Oral</option>
                <option value="revision">Session de Révision</option>
                <option value="lecture">Lecture</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            {/* Priorité */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priorité</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="high">🔴 Haute (Urgent)</option>
                <option value="medium">🟠 Moyenne</option>
                <option value="low">🟢 Basse</option>
              </select>
            </div>
          </div>

          {/* Grid: Échéance, Durée estimée, Statut */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                <span>Date d'échéance</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              />
            </div>

            {/* Durée estimée */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>Durée estimée</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-slate-400">min</span>
              </div>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminé</option>
              </select>
            </div>
          </div>

          {/* Description & Rich Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Consignes & Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes, énoncés, chapitres à réviser..."
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Planificateur de révisions intelligente (si contrôle) */}
          {(type === 'controle' || type === 'projet') && taskId && (
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>Planificateur de révisions espacées</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Générer automatiquement les sessions de révision suggérées (J-14, J-7, J-3, J-1)
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateRevisionPlan}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-medium border border-indigo-500/30 transition-colors"
              >
                Générer
              </button>
            </div>
          )}

          {/* Sous-tâches (Checklist) */}
          {taskId && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-accent" />
                  <span>Sous-tâches ({completedSubsCount}/{taskSubtasks.length})</span>
                </label>
                {taskSubtasks.length > 0 && (
                  <span className="text-xs font-semibold text-slate-400">
                    {progressPercent}%
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {taskSubtasks.length > 0 && (
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-accent h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* Subtasks List */}
              <div className="space-y-1.5">
                {taskSubtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => toggleSubtask(taskId, st.id)}
                        className="rounded border-slate-600 text-accent focus:ring-0 cursor-pointer"
                      />
                      <span
                        className={`text-xs truncate ${
                          st.completed ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {st.title}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteSubtask(taskId, st.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Subtask Input */}
              <form onSubmit={handleAddSubtask} className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Ajouter une étape..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                >
                  Ajouter
                </button>
              </form>
            </div>
          )}

          {/* Documents Liés (SANS COPIE) */}
          {taskId && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-accent" />
                  <span>Documents & Cours liés (Zéro copie)</span>
                </label>
                <button
                  type="button"
                  onClick={handlePickFiles}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 border border-white/5 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Lier un document...</span>
                </button>
              </div>

              {taskAttachments.length === 0 ? (
                <div
                  onClick={handlePickFiles}
                  className="border border-dashed border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-accent/40 transition-colors"
                >
                  <p className="text-xs text-slate-400">
                    Cliquez pour lier un PDF, cours, sujet ou dossier de votre PC.
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Le fichier original n'est jamais déplacé ni copié.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {taskAttachments.map((att) => (
                    <div
                      key={att.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        att.isMissing
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-base">
                          {att.fileType?.includes('pdf')
                            ? '📕'
                            : att.fileType?.includes('doc')
                            ? '📘'
                            : att.fileType?.includes('ppt')
                            ? '📙'
                            : att.fileType?.includes('png') || att.fileType?.includes('jpg')
                            ? '🖼️'
                            : '📄'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-200 truncate" title={att.filePath}>
                            {att.fileName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {att.filePath}
                          </p>
                          {att.isMissing && (
                            <div className="flex items-center gap-1.5 mt-1 text-red-400 text-[11px] font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Fichier déplacé ou introuvable !</span>
                              <button
                                type="button"
                                onClick={() => handleRelocate(att.id)}
                                className="underline hover:text-red-300 ml-1"
                              >
                                Relocaliser...
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {!att.isMissing && (
                          <>
                            <button
                              type="button"
                              onClick={() => window.api.file.openPath(att.filePath)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Ouvrir le document"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => window.api.file.showItemInFolder(att.filePath)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Afficher dans l'explorateur Windows"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttachment(taskId, att.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                          title="Détacher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-accent" />
              <span>Étiquettes (tags)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium flex items-center gap-1"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Ajouter une étiquette (ex : #urgent)..."
                className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-slate-950/40">
          {taskId ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer la tâche</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
