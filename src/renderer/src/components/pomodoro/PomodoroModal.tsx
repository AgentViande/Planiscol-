import React, { useEffect } from "react";
import { X, Play, Pause, RotateCcw, Clock } from "lucide-react";
import { usePomodoroStore } from "../../stores/usePomodoroStore";
import { useTaskStore } from "../../stores/useTaskStore";

interface PomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PomodoroModal: React.FC<PomodoroModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    isRunning,
    mode,
    timeLeft,
    activeTaskId,
    sessionsCompleted,
    start,
    pause,
    reset,
    tick,
    switchMode,
    setActiveTaskId,
  } = usePomodoroStore();

  const { tasks } = useTaskStore();
  const activeTasks = tasks.filter((t) => t.status !== "done");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, tick]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel-elevated w-full max-w-sm rounded-2xl p-6 shadow-2xl border-white/10 text-center space-y-6 animate-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Clock className="w-4 h-4" />
          <span>Minuteur de Concentration</span>
        </div>

        {/* Mode Switcher */}
        <div className="flex justify-center gap-1 p-1 rounded-xl bg-slate-900 border border-white/10">
          <button
            onClick={() => switchMode("work")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "work"
                ? "bg-accent text-white shadow-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Travail (25 min)
          </button>
          <button
            onClick={() => switchMode("break")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "break"
                ? "bg-emerald-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pause (5 min)
          </button>
        </div>

        {/* Big Digital Clock */}
        <div className="py-4">
          <span className="font-mono text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
            {formattedTime}
          </span>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            {mode === "work"
              ? "🎯 Restez concentré sur votre tâche"
              : "☕ Respirez, étirez-vous !"}
          </p>
        </div>

        {/* Task Selector Link */}
        <div className="text-left space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">
            Associer à une tâche :
          </label>
          <select
            value={activeTaskId || ""}
            onChange={(e) => setActiveTaskId(e.target.value || null)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
          >
            <option value="">(Aucune tâche liée)</option>
            {activeTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={reset}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/5"
            title="Réinitialiser"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={isRunning ? pause : start}
            className={`px-6 py-3 rounded-2xl flex items-center gap-2 text-white font-bold text-sm shadow-glow transition-all ${
              isRunning
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-accent hover:bg-accent-hover"
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Démarrer</span>
              </>
            )}
          </button>
        </div>

        {/* Stats footer */}
        <p className="text-[11px] text-slate-500">
          🔥 {sessionsCompleted} session{sessionsCompleted > 1 ? "s" : ""}{" "}
          terminée{sessionsCompleted > 1 ? "s" : ""} aujourd'hui
        </p>
      </div>
    </div>
  );
};
