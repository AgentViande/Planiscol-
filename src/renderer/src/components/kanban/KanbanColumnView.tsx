import React, { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, CheckCircle2, Clock, Sparkles, Inbox } from "lucide-react";
import { KanbanColumn, Task } from "../../types";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnViewProps {
  column: KanbanColumn;
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
  onQuickAdd: (title: string, columnId: string) => Promise<void>;
  onOpenCreateWithColumn?: (columnId: string) => void;
}

export const KanbanColumnView: React.FC<KanbanColumnViewProps> = ({
  column,
  tasks,
  onSelectTask,
  onQuickAdd,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const handleQuickAddSubmit = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault();
    if (!quickTitle.trim()) {
      setIsAdding(false);
      return;
    }
    const title = quickTitle.trim();
    setQuickTitle("");
    setIsAdding(false);
    await onQuickAdd(title, column.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleQuickAddSubmit();
    } else if (e.key === "Escape") {
      setQuickTitle("");
      setIsAdding(false);
    }
  };

  // Icône et couleur selon le statut de base
  const getStatusIcon = () => {
    switch (column.baseStatus) {
      case "done":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  const columnColor =
    column.color ||
    (column.baseStatus === "done"
      ? "#10b981"
      : column.baseStatus === "in_progress"
        ? "#f59e0b"
        : "#6366f1");

  return (
    <div
      ref={setNodeRef}
      className={`w-80 shrink-0 flex flex-col max-h-full rounded-2xl border transition-all duration-200 glass-panel ${
        isOver
          ? "ring-2 ring-accent border-accent/60 bg-accent/5"
          : "border-white/10 hover:border-white/15"
      }`}
      style={{
        background:
          "linear-gradient(180deg, rgba(15, 23, 42, 0.75) 0%, rgba(10, 15, 30, 0.85) 100%)",
      }}
    >
      {/* En-tête de Colonne */}
      <div className="p-3.5 border-b border-white/5 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: columnColor }}
          />
          <div className="flex items-center gap-1.5 truncate">
            {getStatusIcon()}
            <h3 className="font-semibold text-sm text-slate-100 tracking-tight truncate">
              {column.title}
            </h3>
          </div>
        </div>

        {/* Compteur de tâches */}
        <span
          className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/5 shrink-0"
          title={`${tasks.length} tâche(s) dans cette colonne`}
        >
          {tasks.length}
        </span>
      </div>

      {/* Liste des Cartes Déroulante */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[140px]">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-white/10 select-none text-slate-500">
              <Inbox className="w-8 h-8 mb-2 opacity-50 text-slate-400" />
              <p className="text-xs font-medium text-slate-400">
                Aucune tâche ici
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Glissez une carte ou ajoutez-en une ci-dessous
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                onSelectTask={onSelectTask}
              />
            ))
          )}
        </SortableContext>
      </div>

      {/* Pied de Colonne : Ajout Rapide */}
      <div className="p-2.5 border-t border-white/5 shrink-0">
        {isAdding ? (
          <form onSubmit={handleQuickAddSubmit} className="space-y-2">
            <input
              ref={inputRef}
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Titre de la tâche (Entrée pour valider)..."
              className="w-full bg-slate-900 border border-accent rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none ring-1 ring-accent/30 shadow-inner"
            />
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Entrée ⏎ pour valider</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setQuickTitle("");
                    setIsAdding(false);
                  }}
                  className="px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!quickTitle.trim()}
                  className="px-2.5 py-1 rounded bg-accent hover:bg-accent-hover text-white font-medium transition-colors disabled:opacity-50"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 border border-dashed border-white/10 hover:border-white/20 transition-all group"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-accent transition-colors" />
            <span>Ajouter une tâche</span>
          </button>
        )}
      </div>
    </div>
  );
};
