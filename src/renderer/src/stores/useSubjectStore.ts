import { create } from "zustand";
import { Subject } from "../types";

interface SubjectState {
  subjects: Subject[];
  categories: string[];
  isLoading: boolean;
  loadSubjects: () => Promise<void>;
  saveSubject: (subject: Subject) => Promise<Subject>;
  deleteSubject: (id: string) => Promise<void>;
  getSubjectById: (id?: string) => Subject | undefined;
}

const DEFAULT_FALLBACK_SUBJECTS: Subject[] = [
  {
    id: "sub-maths",
    name: "Mathématiques",
    category: "Sciences",
    color: "#3b82f6",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "sub-francais",
    name: "Français",
    category: "Lettres",
    color: "#ef4444",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "sub-histoire",
    name: "Histoire-Géo",
    category: "Sciences Humaines",
    color: "#f97316",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "sub-svt",
    name: "SVT",
    category: "Sciences",
    color: "#10b981",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "sub-physique",
    name: "Physique-Chimie",
    category: "Sciences",
    color: "#06b6d4",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "sub-anglais",
    name: "Anglais",
    category: "Langues",
    color: "#8b5cf6",
    createdAt: "",
    updatedAt: "",
  },
];

export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: DEFAULT_FALLBACK_SUBJECTS,
  categories: ["Sciences", "Lettres", "Sciences Humaines", "Langues"],
  isLoading: false,

  loadSubjects: async (): Promise<void> => {
    try {
      if (typeof window !== "undefined" && window.api) {
        const fetched = await window.api.db.getSubjects();
        const cats = Array.from(
          new Set(fetched.map((s) => s.category || "Général")),
        ).filter(Boolean);
        set({ subjects: fetched, categories: cats, isLoading: false });
      } else {
        set({ subjects: DEFAULT_FALLBACK_SUBJECTS, isLoading: false });
      }
    } catch (err) {
      console.error("Erreur chargement matières:", err);
      set({ isLoading: false });
    }
  },

  saveSubject: async (subject: Subject): Promise<Subject> => {
    let saved = subject;
    if (window.api) {
      saved = await window.api.db.saveSubject(subject);
    }
    const current = get().subjects;
    const index = current.findIndex((s) => s.id === saved.id);
    let updated: Subject[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = saved;
    } else {
      updated = [...current, saved];
    }
    const cats = Array.from(
      new Set(updated.map((s) => s.category || "Général")),
    ).filter(Boolean);
    set({ subjects: updated, categories: cats });
    return saved;
  },

  deleteSubject: async (id: string): Promise<void> => {
    if (window.api) {
      await window.api.db.deleteSubject(id);
    }
    const updated = get().subjects.filter((s) => s.id !== id);
    const cats = Array.from(
      new Set(updated.map((s) => s.category || "Général")),
    ).filter(Boolean);
    set({ subjects: updated, categories: cats });
  },

  getSubjectById: (id?: string): Subject | undefined => {
    if (!id) return undefined;
    return get().subjects.find((s) => s.id === id);
  },
}));
