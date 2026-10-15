import { create } from 'zustand'
import { Task, Subtask, TaskAttachment, PriorityLevel, TaskType, TaskStatus } from '../types'
import confetti from 'canvas-confetti'

interface TaskFilterState {
  searchQuery: string
  selectedSubjectIds: string[]
  selectedPriorities: PriorityLevel[]
  selectedTypes: TaskType[]
  selectedStatuses: TaskStatus[]
  selectedTags: string[]
  sortBy: 'dueDate' | 'priority' | 'subject' | 'status' | 'createdAt'
  sortOrder: 'asc' | 'desc'
  groupBy: 'smart' | 'subject' | 'priority' | 'status' | 'none'
}

interface TaskState {
  tasks: Task[]
  subtasks: Record<string, Subtask[]>
  attachments: Record<string, TaskAttachment[]>
  selectedTaskId: string | null
  filters: TaskFilterState
  isLoading: boolean

  loadTasks: () => Promise<void>
  setSelectedTaskId: (id: string | null) => void
  setFilters: (updates: Partial<TaskFilterState>) => void
  resetFilters: () => void

  saveTask: (task: Task) => Promise<Task>
  deleteTask: (id: string) => Promise<void>
  toggleTaskStatus: (id: string) => Promise<void>

  loadSubtasks: (taskId: string) => Promise<Subtask[]>
  addSubtask: (taskId: string, title: string) => Promise<Subtask>
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>

  loadAttachments: (taskId: string) => Promise<TaskAttachment[]>
  addAttachment: (taskId: string, filePath: string, fileName: string, fileType?: string, fileSize?: number) => Promise<TaskAttachment>
  removeAttachment: (taskId: string, attachmentId: string) => Promise<void>
  relocateAttachment: (taskId: string, attachmentId: string, newPath: string) => Promise<boolean>

  getFilteredTasks: () => Task[]
}

const DEFAULT_FILTERS: TaskFilterState = {
  searchQuery: '',
  selectedSubjectIds: [],
  selectedPriorities: [],
  selectedTypes: [],
  selectedStatuses: [],
  selectedTags: [],
  sortBy: 'dueDate',
  sortOrder: 'asc',
  groupBy: 'smart'
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  subtasks: {},
  attachments: {},
  selectedTaskId: null,
  filters: DEFAULT_FILTERS,
  isLoading: true,

  loadTasks: async (): Promise<void> => {
    try {
      if (window.api) {
        const fetched = await window.api.db.getTasks()
        set({ tasks: fetched, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    } catch (err) {
      console.error('Erreur chargement des tâches:', err)
      set({ isLoading: false })
    }
  },

  setSelectedTaskId: (id: string | null): void => {
    set({ selectedTaskId: id })
    if (id) {
      get().loadSubtasks(id)
      get().loadAttachments(id)
    }
  },

  setFilters: (updates: Partial<TaskFilterState>): void => {
    set((state) => ({ filters: { ...state.filters, ...updates } }))
  },

  resetFilters: (): void => {
    set({ filters: DEFAULT_FILTERS })
  },

  saveTask: async (task: Task): Promise<Task> => {
    let saved = task
    if (window.api) {
      saved = await window.api.db.saveTask(task)
    }
    const current = get().tasks
    const index = current.findIndex((t) => t.id === saved.id)
    let updated: Task[]
    if (index >= 0) {
      updated = [...current]
      updated[index] = saved
    } else {
      updated = [saved, ...current]
    }
    set({ tasks: updated })
    return saved
  },

  deleteTask: async (id: string): Promise<void> => {
    if (window.api) {
      await window.api.db.deleteTask(id)
    }
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId
    }))
  },

  toggleTaskStatus: async (id: string): Promise<void> => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return

    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done'
    const updatedTask: Task = { ...task, status: newStatus, updatedAt: new Date().toISOString() }

    if (newStatus === 'done') {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#10b981', '#3b82f6', '#f59e0b']
        })
      } catch {
        // Safe fallback
      }
    }

    await get().saveTask(updatedTask)
  },

  // --- Sous-tâches ---
  loadSubtasks: async (taskId: string): Promise<Subtask[]> => {
    try {
      if (window.api) {
        const fetched = await window.api.db.getSubtasks(taskId)
        set((state) => ({ subtasks: { ...state.subtasks, [taskId]: fetched } }))
        return fetched
      }
    } catch (err) {
      console.error('Erreur chargement sous-tâches:', err)
    }
    return []
  },

  addSubtask: async (taskId: string, title: string): Promise<Subtask> => {
    const currentList = get().subtasks[taskId] || []
    const newSub: Subtask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      taskId,
      title,
      completed: false,
      orderIndex: currentList.length
    }
    const updated = [...currentList, newSub]
    set((state) => ({ subtasks: { ...state.subtasks, [taskId]: updated } }))
    if (window.api) {
      await window.api.db.saveSubtasks(taskId, updated)
    }
    return newSub
  },

  toggleSubtask: async (taskId: string, subtaskId: string): Promise<void> => {
    const currentList = get().subtasks[taskId] || []
    const updated = currentList.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st))
    set((state) => ({ subtasks: { ...state.subtasks, [taskId]: updated } }))
    if (window.api) {
      await window.api.db.saveSubtasks(taskId, updated)
    }
  },

  deleteSubtask: async (taskId: string, subtaskId: string): Promise<void> => {
    const currentList = get().subtasks[taskId] || []
    const updated = currentList.filter((st) => st.id !== subtaskId)
    set((state) => ({ subtasks: { ...state.subtasks, [taskId]: updated } }))
    if (window.api) {
      await window.api.db.saveSubtasks(taskId, updated)
    }
  },

  // --- Fichiers Liés (ZÉRO COPIE) ---
  loadAttachments: async (taskId: string): Promise<TaskAttachment[]> => {
    try {
      if (window.api) {
        const fetched = await window.api.db.getAttachments(taskId)
        set((state) => ({ attachments: { ...state.attachments, [taskId]: fetched } }))
        return fetched
      }
    } catch (err) {
      console.error('Erreur chargement documents liés:', err)
    }
    return []
  },

  addAttachment: async (
    taskId: string,
    filePath: string,
    fileName: string,
    fileType?: string,
    fileSize?: number
  ): Promise<TaskAttachment> => {
    const newAtt: TaskAttachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      taskId,
      filePath, // STRICT: chemin absolu seulement
      fileName,
      fileType: fileType || fileName.split('.').pop() || 'file',
      fileSize,
      addedAt: new Date().toISOString()
    }

    let saved = newAtt
    if (window.api) {
      saved = await window.api.db.addAttachment(newAtt)
    }

    set((state) => {
      const current = state.attachments[taskId] || []
      return { attachments: { ...state.attachments, [taskId]: [...current, saved] } }
    })
    return saved
  },

  removeAttachment: async (taskId: string, attachmentId: string): Promise<void> => {
    if (window.api) {
      await window.api.db.removeAttachment(attachmentId)
    }
    set((state) => {
      const current = state.attachments[taskId] || []
      return {
        attachments: {
          ...state.attachments,
          [taskId]: current.filter((a) => a.id !== attachmentId)
        }
      }
    })
  },

  relocateAttachment: async (taskId: string, attachmentId: string, newPath: string): Promise<boolean> => {
    let success = false
    if (window.api) {
      success = await window.api.db.relocateAttachment(attachmentId, newPath)
    }
    if (success) {
      await get().loadAttachments(taskId)
    }
    return success
  },

  getFilteredTasks: (): Task[] => {
    const { tasks, filters } = get()
    let result = tasks.filter((t) => !t.isArchived)

    // Recherche
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    // Filtre Matières
    if (filters.selectedSubjectIds.length > 0) {
      result = result.filter((t) => t.subjectId && filters.selectedSubjectIds.includes(t.subjectId))
    }

    // Filtre Priorités
    if (filters.selectedPriorities.length > 0) {
      result = result.filter((t) => filters.selectedPriorities.includes(t.priority))
    }

    // Filtre Types
    if (filters.selectedTypes.length > 0) {
      result = result.filter((t) => filters.selectedTypes.includes(t.type))
    }

    // Filtre Statuts
    if (filters.selectedStatuses.length > 0) {
      result = result.filter((t) => filters.selectedStatuses.includes(t.status))
    }

    // Filtre Tags
    if (filters.selectedTags.length > 0) {
      result = result.filter((t) => filters.selectedTags.some((tag) => t.tags.includes(tag)))
    }

    // Tri
    result.sort((a, b) => {
      if (filters.sortBy === 'dueDate') {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (filters.sortBy === 'priority') {
        const order = { high: 1, medium: 2, low: 3 }
        return order[a.priority] - order[b.priority]
      }
      if (filters.sortBy === 'status') {
        const order = { todo: 1, in_progress: 2, done: 3 }
        return order[a.status] - order[b.status]
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    if (filters.sortOrder === 'desc') {
      result.reverse()
    }

    return result
  }
}))
