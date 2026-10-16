import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Square,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  BellOff,
  Bell,
  CheckSquare,
  Paperclip,
  FileText,
  Check,
  Plus,
  ExternalLink,
  FolderOpen,
  Copy,
  Sparkles,
  BookOpen,
  AlertTriangle,
  Clock,
  ArrowRight,
  Flame,
} from "lucide-react";
import { usePomodoroStore, PomodoroPhase } from "../../stores/usePomodoroStore";
import { useTaskStore } from "../../stores/useTaskStore";
import { useSubjectStore } from "../../stores/useSubjectStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { Task, Subtask } from "../../types";

export const FocusModeView: React.FC = () => {
  const {
    isRunning,
    phase,
    timeLeft,
    totalDurationSeconds,
    cycle,
    cyclesCompleted,
    activeTaskId,
    isFocusModeOpen,
    activeTab,
    showCycleSummary,
    lastSessionWorkedSeconds,
    completedSubtaskIdsInSession,
    sessionNotesDraft,
    closeFocusMode,
    start,
    pause,
    reset,
    skipPhase,
    stop,
    tick,
    setActiveTaskId,
    setActiveTab,
    setSessionNotesDraft,
    dismissCycleSummary,
    recordSubtaskToggledInSession,
    extendWorkMinutes,
  } = usePomodoroStore();

  const { tasks, subtasks, attachments, saveTask, toggleSubtask, addSubtask, loadSubtasks, loadAttachments } =
    useTaskStore();
  const { subjects, getSubjectById } = useSubjectStore();
  const { settings, updateSettings } = useSettingsStore();

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showNotesActionModal, setShowNotesActionModal] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isSystemFullScreen, setIsSystemFullScreen] = useState(false);

  // Synchronisation de l'intervalle d'horloge de précision
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        tick();
      }, 500); // 500ms pour réactivité fluide
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, tick]);

  // Chargement des sous-tâches et documents de la tâche active
  useEffect(() => {
    if (activeTaskId) {
      loadSubtasks(activeTaskId);
      loadAttachments(activeTaskId);
    }
  }, [activeTaskId, loadSubtasks, loadAttachments]);

  // Raccourcis clavier (Espace, Échap, N, T)
  useEffect(() => {
    if (!isFocusModeOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      const isInput = ["INPUT", "TEXTAREA"].includes(
        (e.target as HTMLElement).tagName,
      );

      // Échap pour quitter
      if (e.key === "Escape") {
        e.preventDefault();
        if (isRunning) {
          setShowExitConfirm(true);
        } else {
          handleRequestClose();
        }
        return;
      }

      if (isInput) return;

      // Espace pour Pause / Play
      if (e.code === "Space") {
        e.preventDefault();
        if (isRunning) pause();
        else start();
      }

      // N pour Notes
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setActiveTab("notes");
      }

      // T pour Tâche / Sous-tâches
      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        setActiveTab("task");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusModeOpen, isRunning, pause, start, setActiveTab]);

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId) || null,
    [tasks, activeTaskId],
  );

  const taskSubtasks = activeTaskId ? subtasks[activeTaskId] || [] : [];
  const taskAttachments = activeTaskId ? attachments[activeTaskId] || [] : [];

  const handleRequestClose = (): void => {
    if (sessionNotesDraft.trim() && activeTaskId) {
      setShowNotesActionModal(true);
    } else {
      closeFocusMode();
    }
  };

  const handleToggleSystemFullScreen = async (): Promise<void> => {
    if (window.api?.window?.setFullScreen) {
      const next = !isSystemFullScreen;
      await window.api.window.setFullScreen(next);
      setIsSystemFullScreen(next);
      updateSettings({ fullScreenFocus: next });
    }
  };

  const handleToggleSilentMode = (): void => {
    updateSettings({ pomodoroSilentMode: !settings.pomodoroSilentMode });
  };

  const handleToggleSound = (): void => {
    updateSettings({ pomodoroSoundEnabled: !settings.pomodoroSoundEnabled });
  };

  const handleCopyNotes = (): void => {
    if (!sessionNotesDraft) return;
    navigator.clipboard.writeText(sessionNotesDraft);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  const handleAddSubtaskInline = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!activeTaskId || !newSubtaskTitle.trim()) return;
    await addSubtask(activeTaskId, newSubtaskTitle.trim());
    setNewSubtaskTitle("");
  };

  const handleToggleSubtaskWithTracking = async (st: Subtask): Promise<void> => {
    if (!activeTaskId) return;
    const willBeCompleted = !st.completed;
    await toggleSubtask(activeTaskId, st.id);
    recordSubtaskToggledInSession(st.id, willBeCompleted);
  };

  const handleSaveNotesToDescription = async (): Promise<void> => {
    if (activeTask) {
      const mergedDesc = activeTask.description
        ? `${activeTask.description}\n\n--- Notes de session Focus ---\n${sessionNotesDraft}`
        : sessionNotesDraft;
      await saveTask({
        ...activeTask,
        description: mergedDesc,
        focusNotesDraft: "",
      });
    }
    setShowNotesActionModal(false);
    closeFocusMode();
  };

  const handleKeepNotesDraft = (): void => {
    setShowNotesActionModal(false);
    closeFocusMode();
  };

  const handleDiscardNotes = async (): Promise<void> => {
    if (activeTask) {
      await saveTask({
        ...activeTask,
        focusNotesDraft: "",
      });
    }
    setShowNotesActionModal(false);
    closeFocusMode();
  };

  const handleMarkTaskCompleted = async (): Promise<void> => {
    if (activeTask) {
      await saveTask({
        ...activeTask,
        status: "done",
      });
    }
    dismissCycleSummary();
  };

  if (!isFocusModeOpen) return null;

  // Calcul du temps affiché
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Calcul SVG stroke progress
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const progressRatio =
    totalDurationSeconds > 0 ? timeLeft / totalDurationSeconds : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const phaseLabel =
    phase === "work"
      ? "Concentration"
      : phase === "shortBreak"
        ? "Pause courte"
        : "Pause longue";

  const phaseColor =
    phase === "work"
      ? "#6366f1" // Indigo
      : phase === "shortBreak"
        ? "#10b981" // Émeraude
        : "#06b6d4"; // Cyan

  const subject = activeTask ? getSubjectById(activeTask.subjectId) : null;
  const cyclesTotal = settings.pomodoroCyclesBeforeLongBreak || 4;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl text-slate-100 flex flex-col overflow-hidden select-none"
      >
        {/* 1. Header Toolbar */}
        <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isRunning) setShowExitConfirm(true);
                else handleRequestClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/5 text-xs font-semibold"
            >
              <X className="w-4 h-4" />
              <span>Quitter le focus</span>
              <kbd className="ml-1 text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-400">
                Échap
              </kbd>
            </button>

            {/* Task selector quick pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-xs text-slate-400">Tâche :</span>
              <select
                value={activeTaskId || ""}
                onChange={(e) => setActiveTaskId(e.target.value || null)}
                className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="" className="bg-slate-900 text-slate-300">
                  (Aucune tâche liée)
                </option>
                {tasks
                  .filter((t) => t.status !== "done")
                  .map((t) => (
                    <option
                      key={t.id}
                      value={t.id}
                      className="bg-slate-900 text-slate-200"
                    >
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Quick Controls Right */}
          <div className="flex items-center gap-2">
            {/* Silent Mode Toggle */}
            <button
              onClick={handleToggleSilentMode}
              className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
                settings.pomodoroSilentMode
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
              }`}
              title={
                settings.pomodoroSilentMode
                  ? "Mode silencieux actif (notifications masquées)"
                  : "Activer le mode silencieux"
              }
            >
              {settings.pomodoroSilentMode ? (
                <>
                  <BellOff className="w-4 h-4" />
                  <span className="hidden md:inline font-medium">Silencieux</span>
                </>
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border transition-all text-xs ${
                settings.pomodoroSoundEnabled
                  ? "bg-white/5 border-white/5 text-slate-300 hover:text-white"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
              title={
                settings.pomodoroSoundEnabled
                  ? "Effets sonores activés"
                  : "Effets sonores désactivés"
              }
            >
              {settings.pomodoroSoundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* FullScreen Toggle */}
            <button
              onClick={handleToggleSystemFullScreen}
              className={`p-2 rounded-xl border transition-all text-xs ${
                isSystemFullScreen
                  ? "bg-accent/20 border-accent text-accent shadow-glow"
                  : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
              }`}
              title="Vrai plein écran système (F11)"
            >
              {isSystemFullScreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* 2. Main Work Area (Minuteur central + Panneau latéral) */}
        <div className="flex-1 flex overflow-hidden">
          {/* ZONE CENTRALE : LE MINUTEUR */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
            {/* Ambient Background Glow */}
            <div
              className="absolute w-96 h-96 rounded-full blur-[120px] opacity-25 pointer-events-none transition-colors duration-700"
              style={{ backgroundColor: phaseColor }}
            />

            {/* Animated Phase Badge & Cycle */}
            <div className="flex items-center gap-2 mb-6">
              <span
                className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-glow transition-all"
                style={{
                  backgroundColor: `${phaseColor}20`,
                  borderColor: `${phaseColor}50`,
                  color: phaseColor,
                }}
              >
                {phase === "work" ? "🎯 " : phase === "shortBreak" ? "☕ " : "🌴 "}
                {phaseLabel}
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/5 text-slate-300">
                Cycle {cycle}/{cyclesTotal}
              </span>
            </div>

            {/* Grand Cercle de Progression SVG */}
            <div className="relative w-80 h-80 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Track */}
                <circle
                  cx="160"
                  cy="160"
                  r={radius}
                  className="stroke-slate-800/80"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Dynamic Progress Fill */}
                <circle
                  cx="160"
                  cy="160"
                  r={radius}
                  stroke={phaseColor}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-300"
                />
              </svg>

              {/* Temps central géant */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="font-mono text-7xl font-black tracking-tight text-white drop-shadow-2xl">
                  {timeFormatted}
                </span>
                <p className="text-xs font-medium text-slate-400 mt-2 max-w-[200px] truncate">
                  {activeTask ? activeTask.title : "Mode concentration libre"}
                </p>
              </div>
            </div>

            {/* Commandes du Minuteur */}
            <div className="flex items-center gap-4 mt-8">
              {/* Reset */}
              <button
                onClick={reset}
                className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/10 shadow-sm"
                title="Réinitialiser la phase"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Grand bouton Start / Pause */}
              <button
                onClick={isRunning ? pause : start}
                className={`px-8 py-4 rounded-2xl flex items-center gap-3 text-white font-extrabold text-base shadow-glow transition-all scale-100 hover:scale-105 active:scale-95 ${
                  isRunning
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                    : "bg-accent hover:bg-accent-hover shadow-accent/30"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-6 h-6" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current" />
                    <span>{timeLeft < totalDurationSeconds ? "Reprendre" : "Démarrer"}</span>
                  </>
                )}
              </button>

              {/* Skip Phase */}
              <button
                onClick={skipPhase}
                className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/10 shadow-sm"
                title="Passer à la phase suivante"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Keyboard shortcut hint */}
            <p className="text-[11px] text-slate-500 mt-5">
              Appuyez sur <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-slate-300">Espace</kbd> pour démarrer ou mettre en pause
            </p>
          </div>

          {/* PANNEAU LATÉRAL À 4 ONGLETS */}
          <aside className="w-96 border-l border-white/10 flex flex-col bg-slate-900/40 backdrop-blur-xl">
            {/* Tab navigation */}
            <div className="grid grid-cols-4 p-2 gap-1 border-b border-white/5 bg-slate-950/20">
              <button
                onClick={() => setActiveTab("task")}
                className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "task"
                    ? "bg-accent text-white shadow-glow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tâche</span>
              </button>

              <button
                onClick={() => setActiveTab("subtasks")}
                className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "subtasks"
                    ? "bg-accent text-white shadow-glow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Étapes</span>
                {taskSubtasks.length > 0 && (
                  <span className="text-[10px] bg-white/20 px-1 rounded-full">
                    {taskSubtasks.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("documents")}
                className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "documents"
                    ? "bg-accent text-white shadow-glow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Docs</span>
                {taskAttachments.length > 0 && (
                  <span className="text-[10px] bg-white/20 px-1 rounded-full">
                    {taskAttachments.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("notes")}
                className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "notes"
                    ? "bg-accent text-white shadow-glow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Notes</span>
              </button>
            </div>

            {/* Tab content area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* ONGLET 1 : DÉTAILS DE LA TÂCHE */}
              {activeTab === "task" && (
                <div className="space-y-4">
                  {activeTask ? (
                    <>
                      <div>
                        <span className="text-[11px] uppercase font-bold text-accent tracking-wider">
                          Détails de la tâche
                        </span>
                        <h3 className="text-base font-bold text-white mt-1 leading-snug">
                          {activeTask.title}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {subject && (
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                            style={{
                              backgroundColor: `${subject.color}25`,
                              color: subject.color,
                            }}
                          >
                            {subject.name}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                            activeTask.priority === "high"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : activeTask.priority === "medium"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          Priorité {activeTask.priority}
                        </span>
                      </div>

                      {activeTask.dueDate && (
                        <div className="flex items-center gap-2 text-xs text-slate-300 p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <Clock className="w-4 h-4 text-accent" />
                          <span>
                            Échéance :{" "}
                            {new Date(activeTask.dueDate).toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}

                      {/* Suivi temps passé sur la tâche */}
                      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <div className="flex items-center justify-between text-xs font-medium text-indigo-300">
                          <span className="flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-amber-400" />
                            Temps réel investi
                          </span>
                          <span className="font-bold">
                            {activeTask.actualDuration || 0} min ({activeTask.focusSessionsCount || 0} session{((activeTask.focusSessionsCount || 0) > 1) ? "s" : ""})
                          </span>
                        </div>
                      </div>

                      {/* Description modifiable */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">
                          Description & Consignes :
                        </label>
                        <textarea
                          rows={4}
                          value={activeTask.description || ""}
                          onChange={(e) =>
                            saveTask({ ...activeTask, description: e.target.value })
                          }
                          placeholder="Ajoutez des notes ou précisions..."
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent resize-none"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      <p>Aucune tâche liée à cette session.</p>
                      <p className="text-slate-500 mt-1">
                        Sélectionnez une tâche ci-dessus pour afficher ses détails.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ONGLET 2 : SOUS-TÂCHES */}
              {activeTab === "subtasks" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-accent">
                      Sous-tâches ({taskSubtasks.filter((s) => s.completed).length}/{taskSubtasks.length})
                    </span>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-1.5">
                    {taskSubtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => handleToggleSubtaskWithTracking(st)}
                          className="rounded border-slate-600 text-accent focus:ring-0 cursor-pointer w-4 h-4"
                        />
                        <span
                          className={`text-xs truncate flex-1 ${
                            st.completed ? "line-through text-slate-500" : "text-slate-200"
                          }`}
                        >
                          {st.title}
                        </span>
                      </div>
                    ))}

                    {taskSubtasks.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-6">
                        Aucune sous-tâche pour le moment.
                      </p>
                    )}
                  </div>

                  {/* Ajout rapide sous-tâche */}
                  {activeTaskId && (
                    <form onSubmit={handleAddSubtaskInline} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Nouvelle étape..."
                        className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ONGLET 3 : DOCUMENTS LIÉS (ZÉRO COPIE) */}
              {activeTab === "documents" && (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    Documents liés (Zéro copie)
                  </span>

                  <div className="space-y-2">
                    {taskAttachments.map((att) => (
                      <div
                        key={att.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                          att.isMissing
                            ? "bg-red-500/10 border-red-500/30"
                            : "bg-white/5 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-sm">📄</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-200 truncate" title={att.filePath}>
                              {att.fileName}
                            </p>
                            {att.isMissing && (
                              <p className="text-[10px] text-red-400 flex items-center gap-1 font-semibold">
                                <AlertTriangle className="w-3 h-3" />
                                Lien rompu
                              </p>
                            )}
                          </div>
                        </div>

                        {!att.isMissing && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => window.api?.file?.openPath(att.filePath)}
                              className="p-1 text-slate-400 hover:text-white rounded"
                              title="Ouvrir le fichier"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => window.api?.file?.showItemInFolder(att.filePath)}
                              className="p-1 text-slate-400 hover:text-white rounded"
                              title="Afficher dans l'explorateur"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {taskAttachments.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-6">
                        Aucun document lié à cette tâche.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ONGLET 4 : NOTES TEMPORAIRES (AUTO-SAVE) */}
              {activeTab === "notes" && (
                <div className="space-y-3 flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-accent">
                      Brouillon de notes
                    </span>
                    <button
                      onClick={handleCopyNotes}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
                    >
                      {copiedNotes ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Ces notes sont automatiquement sauvegardées en temps réel.
                  </p>

                  <textarea
                    rows={12}
                    value={sessionNotesDraft}
                    onChange={(e) => setSessionNotesDraft(e.target.value)}
                    placeholder="Écrivez vos pensées, idées, calculs, formules ou étapes..."
                    className="w-full flex-1 bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent resize-none leading-relaxed"
                  />
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* 3. Modal de confirmation de sortie */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-panel-elevated w-full max-w-sm rounded-2xl p-6 shadow-2xl border-white/10 space-y-4 text-center animate-in zoom-in-95">
              <h4 className="text-sm font-bold text-white">Session en cours</h4>
              <p className="text-xs text-slate-300">
                Une session de concentration est actuellement active. Voulez-vous vraiment quitter ? Le temps écoulé sera mis en pause.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 font-semibold"
                >
                  Continuer la session
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    handleRequestClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-glow"
                >
                  Quitter quand même
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Modal Récapitulatif de Fin de Cycle */}
        {showCycleSummary && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-panel-elevated w-full max-w-md rounded-2xl p-6 shadow-2xl border-white/10 space-y-5 animate-in zoom-in-95">
              <div className="text-center space-y-1">
                <span className="text-3xl">🎉</span>
                <h4 className="text-base font-bold text-white">Session accomplie !</h4>
                <p className="text-xs text-slate-400">
                  Bravo pour cette session de travail de {Math.round(lastSessionWorkedSeconds / 60)} minutes.
                </p>
              </div>

              {completedSubtaskIdsInSession.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                  ✅ {completedSubtaskIdsInSession.length} étape{completedSubtaskIdsInSession.length > 1 ? "s" : ""} validée{completedSubtaskIdsInSession.length > 1 ? "s" : ""} durant cette session !
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => extendWorkMinutes(5)}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-semibold text-slate-200"
                >
                  +5 min de rab
                </button>
                <button
                  onClick={dismissCycleSummary}
                  className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-glow"
                >
                  Prendre ma pause
                </button>
              </div>

              {activeTask && activeTask.status !== "done" && (
                <button
                  onClick={handleMarkTaskCompleted}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 border border-white/10 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Marquer la tâche comme terminée</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 5. Modal de gestion des Notes de session à la fermeture */}
        {showNotesActionModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-panel-elevated w-full max-w-md rounded-2xl p-6 shadow-2xl border-white/10 space-y-4 animate-in zoom-in-95">
              <h4 className="text-sm font-bold text-white">Que faire de vos notes de session ?</h4>
              <p className="text-xs text-slate-400">
                Vous avez saisi des notes durant cette session de concentration. Choisissez comment vous souhaitez les conserver :
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSaveNotesToDescription}
                  className="w-full p-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold text-left flex items-center justify-between shadow-glow"
                >
                  <span>Ajouter ces notes à la description de la tâche</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleKeepNotesDraft}
                  className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold text-left flex items-center justify-between border border-white/5"
                >
                  <span>Conserver en brouillon pour la prochaine session</span>
                  <Check className="w-4 h-4" />
                </button>

                <button
                  onClick={handleDiscardNotes}
                  className="w-full p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium text-left border border-red-500/20"
                >
                  Supprimer les notes
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
