import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Calendar,
  Clock,
  Tag,
  X,
  CornerDownLeft,
} from "lucide-react";
import { parseNaturalLanguageTask } from "../../utils/naturalLanguageParser";
import { useSubjectStore } from "../../stores/useSubjectStore";
import { useTaskStore } from "../../stores/useTaskStore";
import { Task } from "../../types";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [input, setInput] = useState("");
  const { subjects, getSubjectById } = useSubjectStore();
  const { saveTask } = useTaskStore();

  useEffect(() => {
    if (isOpen) {
      setInput("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsed = parseNaturalLanguageTask(input, subjects);
  const subject = getSubjectById(parsed.subjectId);

  const handleKeyDown = async (e: React.KeyboardEvent): Promise<void> => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!parsed.title.trim()) return;

      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: parsed.title,
        subjectId: parsed.subjectId,
        type: parsed.type,
        priority: parsed.priority,
        dueDate: parsed.dueDate,
        estimatedDuration: parsed.estimatedDuration || 30,
        status: "todo",
        tags: parsed.tags,
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveTask(newTask);
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150">
      <div className="glass-panel-elevated w-full max-w-xl rounded-2xl p-5 shadow-2xl border-indigo-500/30 animate-in zoom-in-95 duration-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
            <Sparkles className="w-4 h-4" />
            <span>Ajout Rapide en Langage Naturel</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Text */}
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex : Maths exo p.45 vendredi 18h priorité haute #important"
            className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent shadow-inner font-medium"
            autoFocus
          />
        </div>

        {/* Live Parsed Preview Chips */}
        {input.trim() && (
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Aperçu analysé automatiquement :
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {/* Titre */}
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-semibold">
                {parsed.title}
              </span>

              {/* Matière */}
              {subject && (
                <span
                  className="px-2 py-0.5 rounded-md font-semibold"
                  style={{
                    backgroundColor: `${subject.color}25`,
                    color: subject.color,
                  }}
                >
                  {subject.name}
                </span>
              )}

              {/* Priorité */}
              <span
                className={`px-2 py-0.5 rounded-md font-semibold ${
                  parsed.priority === "high"
                    ? "bg-red-500/20 text-red-300"
                    : parsed.priority === "medium"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {parsed.priority === "high"
                  ? "🔴 Haute"
                  : parsed.priority === "medium"
                    ? "🟠 Moyenne"
                    : "🟢 Basse"}
              </span>

              {/* Type */}
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 capitalize">
                {parsed.type}
              </span>

              {/* Échéance */}
              {parsed.dueDate && (
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 flex items-center gap-1 font-medium">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(parsed.dueDate).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              )}

              {/* Durée */}
              {parsed.estimatedDuration && (
                <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{parsed.estimatedDuration} min</span>
                </span>
              )}

              {/* Tags */}
              {parsed.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  <span>#{t}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer tip */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>
            Tapez votre consigne naturellement avec dates, heures et matières.
          </span>
          <div className="flex items-center gap-1 font-semibold text-slate-300">
            <span>Appuyez sur</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 flex items-center gap-0.5">
              <span>Entrée</span>
              <CornerDownLeft className="w-3 h-3" />
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
