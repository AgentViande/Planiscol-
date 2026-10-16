import { create } from "zustand";
import { useSettingsStore } from "./useSettingsStore";
import { useTaskStore } from "./useTaskStore";

export type PomodoroPhase = "work" | "shortBreak" | "longBreak";

// Synthétiseur audio doux Web Audio API sans asset externe
function playFocusTone(type: "start" | "work-complete" | "break-complete"): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "work-complete") {
      // Accord doux ascendant de félicitations
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.3); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === "break-complete") {
      // Accord doux invitant à reprendre
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.15); // C#5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      // Start click doux
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch {
    // Ignorer si audio bloqué par politique autoplay du navigateur
  }
}

interface PomodoroState {
  isRunning: boolean;
  phase: PomodoroPhase;
  timeLeft: number; // en secondes restantes
  targetEndTime: number | null; // Timestamp absolu pour calcul précis immunisé contre la mise en veille
  totalDurationSeconds: number; // Durée totale de la phase actuelle
  cycle: number; // Cycle courant (1..cyclesBeforeLongBreak)
  cyclesCompleted: number;
  activeTaskId: string | null;
  isFocusModeOpen: boolean;
  activeTab: "task" | "subtasks" | "documents" | "notes";
  showCycleSummary: boolean;
  lastSessionWorkedSeconds: number;
  completedSubtaskIdsInSession: string[];
  sessionNotesDraft: string;

  // Actions
  openFocusMode: (taskId?: string | null) => void;
  closeFocusMode: () => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skipPhase: () => void;
  stop: () => void;
  tick: () => void;
  switchPhase: (newPhase: PomodoroPhase) => void;
  setActiveTaskId: (id: string | null) => void;
  setActiveTab: (tab: "task" | "subtasks" | "documents" | "notes") => void;
  setSessionNotesDraft: (notes: string) => void;
  dismissCycleSummary: () => void;
  recordSubtaskToggledInSession: (subtaskId: string, isNowCompleted: boolean) => void;
  extendWorkMinutes: (minutes: number) => void;
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  isRunning: false,
  phase: "work",
  timeLeft: 25 * 60,
  targetEndTime: null,
  totalDurationSeconds: 25 * 60,
  cycle: 1,
  cyclesCompleted: 0,
  activeTaskId: null,
  isFocusModeOpen: false,
  activeTab: "task",
  showCycleSummary: false,
  lastSessionWorkedSeconds: 0,
  completedSubtaskIdsInSession: [],
  sessionNotesDraft: "",

  openFocusMode: (taskId?: string | null): void => {
    const { settings } = useSettingsStore.getState();
    const targetTaskId = taskId !== undefined ? taskId : get().activeTaskId;

    // Charger les notes brouillon de la tâche si disponible
    let draftNotes = "";
    if (targetTaskId) {
      const task = useTaskStore.getState().tasks.find((t) => t.id === targetTaskId);
      if (task?.focusNotesDraft) draftNotes = task.focusNotesDraft;
    }

    // Gestion du plein écran système si option activée
    if (settings.fullScreenFocus && window.api?.window?.setFullScreen) {
      window.api.window.setFullScreen(true);
    }

    set({
      isFocusModeOpen: true,
      activeTaskId: targetTaskId,
      sessionNotesDraft: draftNotes,
    });
  },

  closeFocusMode: (): void => {
    const { isRunning } = get();
    if (isRunning) {
      get().pause();
    }

    // Restauration de l'écran normal si plein écran système actif
    if (window.api?.window?.setFullScreen) {
      window.api.window.setFullScreen(false);
    }

    set({ isFocusModeOpen: false });
  },

  start: (): void => {
    const { timeLeft, phase } = get();
    const { settings } = useSettingsStore.getState();
    if (settings.pomodoroSoundEnabled) {
      playFocusTone("start");
    }

    const now = Date.now();
    const targetEndTime = now + timeLeft * 1000;
    set({
      isRunning: true,
      targetEndTime,
    });
  },

  pause: (): void => {
    const { targetEndTime } = get();
    let remaining = get().timeLeft;
    if (targetEndTime) {
      const diffMs = targetEndTime - Date.now();
      remaining = Math.max(0, Math.round(diffMs / 1000));
    }
    set({
      isRunning: false,
      timeLeft: remaining,
      targetEndTime: null,
    });
  },

  reset: (): void => {
    const { phase } = get();
    const { settings } = useSettingsStore.getState();
    let durationMinutes = 25;
    if (phase === "work") durationMinutes = settings.pomodoroWorkDuration || 25;
    else if (phase === "shortBreak") durationMinutes = settings.pomodoroBreakDuration || 5;
    else durationMinutes = settings.pomodoroLongBreakDuration || 15;

    set({
      isRunning: false,
      timeLeft: durationMinutes * 60,
      totalDurationSeconds: durationMinutes * 60,
      targetEndTime: null,
    });
  },

  skipPhase: (): void => {
    const { phase, cycle } = get();
    const { settings } = useSettingsStore.getState();
    const cyclesMax = settings.pomodoroCyclesBeforeLongBreak || 4;

    if (phase === "work") {
      // Passer au break
      if (cycle >= cyclesMax) {
        get().switchPhase("longBreak");
      } else {
        get().switchPhase("shortBreak");
      }
    } else {
      // Passer au travail suivant
      set((s) => ({ cycle: s.cycle >= cyclesMax ? 1 : s.cycle + 1 }));
      get().switchPhase("work");
    }
  },

  stop: (): void => {
    get().reset();
  },

  switchPhase: (newPhase: PomodoroPhase): void => {
    const { settings } = useSettingsStore.getState();
    let durationMinutes = 25;
    if (newPhase === "work") durationMinutes = settings.pomodoroWorkDuration || 25;
    else if (newPhase === "shortBreak") durationMinutes = settings.pomodoroBreakDuration || 5;
    else durationMinutes = settings.pomodoroLongBreakDuration || 15;

    set({
      phase: newPhase,
      isRunning: false,
      timeLeft: durationMinutes * 60,
      totalDurationSeconds: durationMinutes * 60,
      targetEndTime: null,
    });
  },

  setActiveTaskId: (id: string | null): void => {
    let draftNotes = "";
    if (id) {
      const task = useTaskStore.getState().tasks.find((t) => t.id === id);
      if (task?.focusNotesDraft) draftNotes = task.focusNotesDraft;
    }
    set({ activeTaskId: id, sessionNotesDraft: draftNotes });
  },

  setActiveTab: (tab: "task" | "subtasks" | "documents" | "notes"): void => {
    set({ activeTab: tab });
  },

  setSessionNotesDraft: (notes: string): void => {
    set({ sessionNotesDraft: notes });
    // Sauvegarde en continu sur la tâche si liée
    const { activeTaskId } = get();
    if (activeTaskId) {
      const task = useTaskStore.getState().tasks.find((t) => t.id === activeTaskId);
      if (task) {
        useTaskStore.getState().saveTask({
          ...task,
          focusNotesDraft: notes,
        });
      }
    }
  },

  recordSubtaskToggledInSession: (subtaskId: string, isNowCompleted: boolean): void => {
    const { completedSubtaskIdsInSession } = get();
    if (isNowCompleted) {
      if (!completedSubtaskIdsInSession.includes(subtaskId)) {
        set({
          completedSubtaskIdsInSession: [...completedSubtaskIdsInSession, subtaskId],
        });
      }
    } else {
      set({
        completedSubtaskIdsInSession: completedSubtaskIdsInSession.filter((id) => id !== subtaskId),
      });
    }
  },

  dismissCycleSummary: (): void => {
    set({ showCycleSummary: false });
  },

  extendWorkMinutes: (minutes: number): void => {
    set((s) => ({
      timeLeft: s.timeLeft + minutes * 60,
      totalDurationSeconds: s.totalDurationSeconds + minutes * 60,
      targetEndTime: s.targetEndTime ? s.targetEndTime + minutes * 60 * 1000 : null,
      showCycleSummary: false,
      phase: "work",
      isRunning: true,
    }));
  },

  tick: (): void => {
    const { isRunning, targetEndTime, phase, activeTaskId, cycle } = get();
    if (!isRunning || !targetEndTime) return;

    const now = Date.now();
    const diffMs = targetEndTime - now;
    const remainingSeconds = Math.max(0, Math.ceil(diffMs / 1000));

    if (remainingSeconds > 0) {
      set({ timeLeft: remainingSeconds });
    } else {
      // --- Fin de Phase ---
      const { settings } = useSettingsStore.getState();
      const cyclesMax = settings.pomodoroCyclesBeforeLongBreak || 4;

      if (phase === "work") {
        const workedMinutes = settings.pomodoroWorkDuration || 25;
        const workedSeconds = workedMinutes * 60;

        // 1. Enregistrement en base de données SQLite/JSON
        if (window.api) {
          window.api.db.logPomodoroSession({
            id: `pomo-${Date.now()}`,
            taskId: activeTaskId || undefined,
            durationMinutes: workedMinutes,
            completedAt: new Date().toISOString(),
          });

          // Notification système native si pas en mode silencieux
          if (!settings.pomodoroSilentMode) {
            window.api.notification.show({
              title: "Session de Concentration accomplie ! 🎉",
              body: `Bravo ! Vous venez d'accomplir ${workedMinutes} minutes de concentration.`,
            });
          }
        }

        // 2. Mise à jour cumulée sur la tâche (temps passé + sessions)
        if (activeTaskId) {
          const taskStore = useTaskStore.getState();
          const task = taskStore.tasks.find((t) => t.id === activeTaskId);
          if (task) {
            const currentActual = task.actualDuration || 0;
            const currentSessions = task.focusSessionsCount || 0;
            taskStore.saveTask({
              ...task,
              actualDuration: currentActual + workedMinutes,
              focusSessionsCount: currentSessions + 1,
            });
          }
        }

        // 3. Audio feed-back
        if (settings.pomodoroSoundEnabled) {
          playFocusTone("work-complete");
        }

        // 4. Passage en pause (courte ou longue) et affichage récapitulatif
        const isLongBreak = cycle >= cyclesMax;
        const nextPhase: PomodoroPhase = isLongBreak ? "longBreak" : "shortBreak";
        const breakDuration = isLongBreak
          ? settings.pomodoroLongBreakDuration || 15
          : settings.pomodoroBreakDuration || 5;

        set((state) => ({
          isRunning: false,
          targetEndTime: null,
          phase: nextPhase,
          timeLeft: breakDuration * 60,
          totalDurationSeconds: breakDuration * 60,
          cyclesCompleted: state.cyclesCompleted + 1,
          lastSessionWorkedSeconds: workedSeconds,
          showCycleSummary: true,
        }));
      } else {
        // Fin de la pause
        if (settings.pomodoroSoundEnabled) {
          playFocusTone("break-complete");
        }

        if (window.api && !settings.pomodoroSilentMode) {
          window.api.notification.show({
            title: "Pause terminée ! ⏳",
            body: "Prêt pour une nouvelle session de concentration ?",
          });
        }

        // Début du prochain cycle
        const nextCycle = cycle >= cyclesMax ? 1 : cycle + 1;
        const workDuration = settings.pomodoroWorkDuration || 25;

        set({
          isRunning: false,
          targetEndTime: null,
          phase: "work",
          cycle: nextCycle,
          timeLeft: workDuration * 60,
          totalDurationSeconds: workDuration * 60,
          completedSubtaskIdsInSession: [],
        });
      }
    }
  },
}));
