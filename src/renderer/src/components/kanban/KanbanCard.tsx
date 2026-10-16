import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  Paperclip,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Flame,
} from "lucide-react";
import { Task } from "../../types";
import { useSubjectStore } from "../../stores/useSubjectStore";
import { useTaskStore } from "../../stores/useTaskStore";
import { usePomodoroStore } from "../../stores/usePomodoroStore";
import { formatDueDateFriendly } from "../../utils/formatDueDate";

interface KanbanCardProps {
  task: Task;
  onSelectTask: (taskId: string) => void;
  isOverlay?: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  onSelectTask,
  isOverlay = false,
}) => {
  const { getSubjectById } = useSubjectStore();
  const { subtasks, attachments } = useTaskStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isOverlay,
  });

  const subject = getSubjectById(task.subjectId);
  const taskSubs = subtasks[task.id] || [];
  const completedSubs = taskSubs.filter((s) => s.completed).length;
  const taskAtts = attachments[task.id] || [];
  const hasBrokenAttachment = taskAtts.some((a) => a.isMissing);

  const isDone = task.status === "done";
  const { text: dueText, isOverdue } = formatDueDateFriendly(task.dueDate);
  const showOverdue = !isDone && isOverdue;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const priorityConfig = {
    high: {
      icon: "🔴",
      label: "Haute",
      className: "bg-red-500/15 text-red-300 border-red-500/30",
    },
    medium: {
      icon: "🟠",
      label: "Moyenne",
      className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    low: {
      icon: "🟢",
      label: "Basse",
      className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
  };

  const currentPriority =
    priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Empêche l'ouverture si un glisser-déposer est en cours
        if (isDragging) return;
        e.stopPropagation();
        onSelectTask(task.id);
      }}
      className={`relative group rounded-xl p-3.5 transition-all duration-200 select-none cursor-grab active:cursor-grabbing border ${
        isOverlay
          ? "bg-slate-900/95 shadow-glass-hover border-accent/50 scale-105 rotate-1 z-50 ring-2 ring-accent/30"
          : isDone
            ? "bg-slate-900/40 hover:bg-slate-900/60 border-white/5 opacity-80"
            : "bg-slate-900/75 hover:bg-slate-800/80 border-white/10 hover:border-white/20 shadow-sm hover:shadow-md"
      }`}
      role="button"
      tabIndex={0}
      aria-label={`Tâche : ${task.title}, priorité ${currentPriority.label}, statut ${task.status}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectTask(task.id);
        }
      }}
    >
      {/* Bande de couleur de matière sur le bord gauche */}
      {subject && (
        <div
          className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all"
          style={{ backgroundColor: subject.color }}
          title={`Matière : ${subject.name}`}
        />
      )}

      <div className="space-y-2.5 pl-1.5">
        {/* Ligne 1 : Matière & Badges Priorité / Type */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          {subject ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: subject.color }}
              />
              <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[120px]">
                {subject.name}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-500 italic">
              Sans matière
            </span>
          )}

          <div className="flex items-center gap-1">
            {/* Badge de Priorité Accessible (Icône + Couleur + Texte) */}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${currentPriority.className}`}
              title={`Priorité : ${currentPriority.label}`}
            >
              <span aria-hidden="true">{currentPriority.icon}</span>
              <span>{currentPriority.label}</span>
            </span>

            {/* Badge Type */}
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400 capitalize shrink-0">
              {task.type}
            </span>
          </div>
        </div>

        {/* Ligne 2 : Titre de la tâche et bouton Focus */}
        <div className="flex items-start justify-between gap-1">
          <h4
            className={`text-sm font-medium tracking-tight line-clamp-2 transition-colors flex-1 ${
              isDone
                ? "line-through text-slate-500"
                : "text-slate-100 group-hover:text-white"
            }`}
          >
            {task.title}
          </h4>
          {!isDone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                usePomodoroStore.getState().openFocusMode(task.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 rounded transition-all shrink-0"
              title="Se concentrer sur cette tâche"
            >
              <Flame className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Ligne 3 : Barre de progression des sous-tâches */}
        {taskSubs.length > 0 && (
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                <ListTodo className="w-3 h-3 text-slate-400" />
                <span>Sous-tâches</span>
              </span>
              <span className="font-mono text-[10px]">
                {completedSubs}/{taskSubs.length}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${(completedSubs / taskSubs.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Ligne 4 : Métadonnées (Échéance, Trombone documents, Tags) */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-xs text-slate-400">
          {/* Échéance */}
          <div className="flex items-center gap-1 min-w-0">
            {task.dueDate ? (
              <span
                className={`flex items-center gap-1 text-[11px] font-medium truncate ${
                  showOverdue
                    ? "text-red-400 font-bold"
                    : isDone
                      ? "text-slate-500"
                      : "text-slate-300"
                }`}
                title={`Échéance : ${task.dueDate}`}
              >
                <Calendar
                  className={`w-3.5 h-3.5 shrink-0 ${showOverdue ? "text-red-400 animate-pulse" : ""}`}
                />
                <span className="truncate">{dueText}</span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">Pas d'échéance</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Documents attachés avec détection de lien rompu */}
            {taskAtts.length > 0 && (
              <div
                className={`flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded ${
                  hasBrokenAttachment
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-white/5 text-indigo-300"
                }`}
                title={
                  hasBrokenAttachment
                    ? `${taskAtts.length} document(s) dont au moins un lien introuvable`
                    : `${taskAtts.length} document(s) lié(s)`
                }
              >
                <Paperclip className="w-3 h-3" />
                <span>{taskAtts.length}</span>
                {hasBrokenAttachment && (
                  <AlertTriangle className="w-2.5 h-2.5 ml-0.5 text-amber-400" />
                )}
              </div>
            )}

            {/* Statut Terminé visuel */}
            {isDone && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
        </div>

        {/* Tags optionnels */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-white/5"
              >
                #{tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-[9px] text-slate-500">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
