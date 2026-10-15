import { create } from "zustand";
import { Grade } from "../types";
import { useSubjectStore } from "./useSubjectStore";

interface GradeState {
  grades: Grade[];
  isLoading: boolean;
  loadGrades: () => Promise<void>;
  saveGrade: (grade: Grade) => Promise<Grade>;
  deleteGrade: (id: string) => Promise<void>;
  getSubjectAverage: (subjectId: string) => number | null;
  getOverallAverage: () => number | null;
}

export const useGradeStore = create<GradeState>((set, get) => ({
  grades: [],
  isLoading: true,

  loadGrades: async (): Promise<void> => {
    try {
      if (window.api) {
        const fetched = await window.api.db.getGrades();
        set({ grades: fetched, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error("Erreur chargement des notes:", err);
      set({ isLoading: false });
    }
  },

  saveGrade: async (grade: Grade): Promise<Grade> => {
    let saved = grade;
    if (window.api) {
      saved = await window.api.db.saveGrade(grade);
    }
    const current = get().grades;
    const index = current.findIndex((g) => g.id === saved.id);
    let updated: Grade[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = saved;
    } else {
      updated = [saved, ...current];
    }
    set({ grades: updated });
    return saved;
  },

  deleteGrade: async (id: string): Promise<void> => {
    if (window.api) {
      await window.api.db.deleteGrade(id);
    }
    set((state) => ({ grades: state.grades.filter((g) => g.id !== id) }));
  },

  getSubjectAverage: (subjectId: string): number | null => {
    const list = get().grades.filter((g) => g.subjectId === subjectId);
    if (list.length === 0) return null;

    let totalPoints = 0;
    let totalCoeff = 0;

    for (const g of list) {
      // Normalisation sur 20
      const normalizedValue = (g.value / (g.outOf || 20)) * 20;
      const coeff = g.coefficient > 0 ? g.coefficient : 1;
      totalPoints += normalizedValue * coeff;
      totalCoeff += coeff;
    }

    if (totalCoeff === 0) return null;
    return Math.round((totalPoints / totalCoeff) * 100) / 100;
  },

  getOverallAverage: (): number | null => {
    const subjects = useSubjectStore.getState().subjects;
    let totalPoints = 0;
    let totalCoeff = 0;

    for (const s of subjects) {
      const avg = get().getSubjectAverage(s.id);
      if (avg !== null) {
        const coeff = s.coefficient && s.coefficient > 0 ? s.coefficient : 1;
        totalPoints += avg * coeff;
        totalCoeff += coeff;
      }
    }

    if (totalCoeff === 0) return null;
    return Math.round((totalPoints / totalCoeff) * 100) / 100;
  },
}));
