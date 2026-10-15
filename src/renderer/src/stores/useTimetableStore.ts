import { create } from "zustand";
import { TimetableSlot } from "../types";

interface TimetableState {
  slots: TimetableSlot[];
  isLoading: boolean;
  loadTimetable: () => Promise<void>;
  saveTimetable: (slots: TimetableSlot[]) => Promise<void>;
  addSlot: (slot: Omit<TimetableSlot, "id">) => Promise<TimetableSlot>;
  deleteSlot: (id: string) => Promise<void>;
}

export const useTimetableStore = create<TimetableState>((set, get) => ({
  slots: [],
  isLoading: true,

  loadTimetable: async (): Promise<void> => {
    try {
      if (window.api) {
        const fetched = await window.api.db.getTimetable();
        set({ slots: fetched, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error("Erreur chargement emploi du temps:", err);
      set({ isLoading: false });
    }
  },

  saveTimetable: async (slots: TimetableSlot[]): Promise<void> => {
    set({ slots });
    if (window.api) {
      await window.api.db.saveTimetable(slots);
    }
  },

  addSlot: async (
    slotData: Omit<TimetableSlot, "id">,
  ): Promise<TimetableSlot> => {
    const newSlot: TimetableSlot = {
      ...slotData,
      id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = [...get().slots, newSlot];
    set({ slots: updated });
    if (window.api) {
      await window.api.db.saveTimetable(updated);
    }
    return newSlot;
  },

  deleteSlot: async (id: string): Promise<void> => {
    const updated = get().slots.filter((s) => s.id !== id);
    set({ slots: updated });
    if (window.api) {
      await window.api.db.saveTimetable(updated);
    }
  },
}));
