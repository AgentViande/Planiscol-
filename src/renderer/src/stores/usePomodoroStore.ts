import { create } from "zustand";
import { useSettingsStore } from "./useSettingsStore";

interface PomodoroState {
  isRunning: boolean;
  mode: "work" | "break";
  timeLeft: number; // en secondes
  activeTaskId: string | null;
  sessionsCompleted: number;

  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  switchMode: (newMode: "work" | "break") => void;
  setActiveTaskId: (id: string | null) => void;
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  isRunning: false,
  mode: "work",
  timeLeft: 25 * 60,
  activeTaskId: null,
  sessionsCompleted: 0,

  start: (): void => {
    set({ isRunning: true });
  },

  pause: (): void => {
    set({ isRunning: false });
  },

  reset: (): void => {
    const { settings } = useSettingsStore.getState();
    const { mode } = get();
    const duration =
      mode === "work"
        ? settings.pomodoroWorkDuration
        : settings.pomodoroBreakDuration;
    set({ isRunning: false, timeLeft: duration * 60 });
  },

  switchMode: (newMode: "work" | "break"): void => {
    const { settings } = useSettingsStore.getState();
    const duration =
      newMode === "work"
        ? settings.pomodoroWorkDuration
        : settings.pomodoroBreakDuration;
    set({ mode: newMode, isRunning: false, timeLeft: duration * 60 });
  },

  setActiveTaskId: (id: string | null): void => {
    set({ activeTaskId: id });
  },

  tick: (): void => {
    const { timeLeft, mode, activeTaskId } = get();
    if (timeLeft > 1) {
      set({ timeLeft: timeLeft - 1 });
    } else {
      // Fin de la session
      if (mode === "work") {
        const { settings } = useSettingsStore.getState();
        // Enregistre en base
        if (window.api) {
          window.api.db.logPomodoroSession({
            id: `pomo-${Date.now()}`,
            taskId: activeTaskId || undefined,
            durationMinutes: settings.pomodoroWorkDuration,
            completedAt: new Date().toISOString(),
          });
          window.api.notification.show({
            title: "Session Pomodoro terminée ! 🎉",
            body: "Bravo pour votre session de travail. Il est temps de faire une petite pause.",
          });
        }
        set((state) => ({
          sessionsCompleted: state.sessionsCompleted + 1,
          mode: "break",
          isRunning: false,
          timeLeft: settings.pomodoroBreakDuration * 60,
        }));
      } else {
        const { settings } = useSettingsStore.getState();
        if (window.api) {
          window.api.notification.show({
            title: "Pause terminée ! ⏳",
            body: "Prêt à reprendre une session productive ?",
          });
        }
        set({
          mode: "work",
          isRunning: false,
          timeLeft: settings.pomodoroWorkDuration * 60,
        });
      }
    }
  },
}));
