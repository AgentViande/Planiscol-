import { create } from 'zustand'
import { Subject } from '../types'

interface SubjectState {
  subjects: Subject[]
  categories: string[]
  isLoading: boolean
  loadSubjects: () => Promise<void>
  saveSubject: (subject: Subject) => Promise<Subject>
  deleteSubject: (id: string) => Promise<void>
  getSubjectById: (id?: string) => Subject | undefined
}

export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: [],
  categories: [],
  isLoading: true,

  loadSubjects: async (): Promise<void> => {
    try {
      if (window.api) {
        const fetched = await window.api.db.getSubjects()
        const cats = Array.from(new Set(fetched.map((s) => s.category || 'Général'))).filter(Boolean)
        set({ subjects: fetched, categories: cats, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    } catch (err) {
      console.error('Erreur chargement matières:', err)
      set({ isLoading: false })
    }
  },

  saveSubject: async (subject: Subject): Promise<Subject> => {
    let saved = subject
    if (window.api) {
      saved = await window.api.db.saveSubject(subject)
    }
    const current = get().subjects
    const index = current.findIndex((s) => s.id === saved.id)
    let updated: Subject[]
    if (index >= 0) {
      updated = [...current]
      updated[index] = saved
    } else {
      updated = [...current, saved]
    }
    const cats = Array.from(new Set(updated.map((s) => s.category || 'Général'))).filter(Boolean)
    set({ subjects: updated, categories: cats })
    return saved
  },

  deleteSubject: async (id: string): Promise<void> => {
    if (window.api) {
      await window.api.db.deleteSubject(id)
    }
    const updated = get().subjects.filter((s) => s.id !== id)
    const cats = Array.from(new Set(updated.map((s) => s.category || 'Général'))).filter(Boolean)
    set({ subjects: updated, categories: cats })
  },

  getSubjectById: (id?: string): Subject | undefined => {
    if (!id) return undefined
    return get().subjects.find((s) => s.id === id)
  }
}))
