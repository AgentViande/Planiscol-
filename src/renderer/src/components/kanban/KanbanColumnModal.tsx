import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Palette,
} from "lucide-react";
import { KanbanColumn, TaskStatus } from "../../types";
import { useTaskStore } from "../../stores/useTaskStore";

interface KanbanColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#3b82f6", // Bleu
  "#06b6d4", // Cyan
  "#10b981", // Émeraude
  "#84cc16", // Lime
  "#f59e0b", // Ambre
  "#f97316", // Orange
  "#ef4444", // Rouge
  "#ec4899", // Rose
  "#8b5cf6", // Violet
];

export const KanbanColumnModal: React.FC<KanbanColumnModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    kanbanColumns,
    saveKanbanColumns,
    addKanbanColumn,
    deleteKanbanColumn,
    updateKanbanColumn,
  } = useTaskStore();

  const [newTitle, setNewTitle] = useState("");
  const [newBaseStatus, setNewBaseStatus] = useState<TaskStatus>("todo");
  const [newColor, setNewColor] = useState("#6366f1");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Vérifier combien de colonnes existent par baseStatus
  const countByStatus = (status: TaskStatus) =>
    kanbanColumns.filter((c) => c.baseStatus === status).length;

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!newTitle.trim()) {
      setErrorMsg("Veuillez spécifier un nom de colonne.");
      return;
    }

    try {
      await addKanbanColumn(newTitle.trim(), newBaseStatus, newColor);
      setNewTitle("");
      setNewColor("#6366f1");
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l’ajout de la colonne");
    }
  };

  const handleDelete = async (col: KanbanColumn) => {
    setErrorMsg(null);
    if (countByStatus(col.baseStatus) <= 1) {
      setErrorMsg(
        `Impossible de supprimer "${col.title}" : il doit subsister au moins une colonne pour le statut "${
          col.baseStatus === "todo"
            ? "À faire"
            : col.baseStatus === "in_progress"
              ? "En cours"
              : "Terminé"
        }".`,
      );
      return;
    }

    const confirmed = window.confirm(
      `Confirmez-vous la suppression de la colonne "${col.title}" ? Les tâches associées seront automatiquement déplacées vers une autre colonne du même statut.`,
    );
    if (!confirmed) return;

    await deleteKanbanColumn(col.id);
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= kanbanColumns.length) return;

    const newCols = [...kanbanColumns];
    const temp = newCols[index];
    newCols[index] = newCols[targetIndex];
    newCols[targetIndex] = temp;

    // Réassigner orderIndex
    newCols.forEach((c, idx) => {
      c.orderIndex = idx;
    });

    await saveKanbanColumns(newCols);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="glass-panel-elevated w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border-white/10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Personnaliser les Colonnes Kanban
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Formulaire d'ajout d'une colonne */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-3">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Ajouter une nouvelle colonne
            </h3>
            <form onSubmit={handleAddColumn} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">
                    Nom de la colonne
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: À relire, En attente..."
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">
                    Statut de base rattaché
                  </label>
                  <select
                    value={newBaseStatus}
                    onChange={(e) =>
                      setNewBaseStatus(e.target.value as TaskStatus)
                    }
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option value="todo">À faire (Tâche ouverte)</option>
                    <option value="in_progress">
                      En cours (En progression)
                    </option>
                    <option value="done">Terminé (Tâche complétée)</option>
                  </select>
                </div>
              </div>

              {/* Sélection de couleur */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">
                  Couleur d'identification
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewColor(col)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newColor === col
                          ? "scale-125 ring-2 ring-white shadow-md"
                          : "hover:scale-110 opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter la colonne</span>
                </button>
              </div>
            </form>
          </div>

          {/* Liste des colonnes actuelles */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Colonnes existantes ({kanbanColumns.length})
            </h3>
            <div className="space-y-2">
              {kanbanColumns.map((col, idx) => {
                const canDelete = countByStatus(col.baseStatus) > 1;

                return (
                  <div
                    key={col.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5 gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: col.color || "#6366f1" }}
                      />
                      <input
                        type="text"
                        value={col.title}
                        onChange={(e) =>
                          updateKanbanColumn(col.id, { title: e.target.value })
                        }
                        className="bg-transparent text-xs font-medium text-white border-b border-transparent hover:border-white/20 focus:border-accent focus:outline-none px-1 py-0.5 truncate flex-1"
                      />
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 shrink-0">
                        {col.baseStatus === "done"
                          ? "Terminé"
                          : col.baseStatus === "in_progress"
                            ? "En cours"
                            : "À faire"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Réordonner Up / Down */}
                      <button
                        type="button"
                        onClick={() => handleMove(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-20"
                        title="Monter"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, "down")}
                        disabled={idx === kanbanColumns.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-20"
                        title="Descendre"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Supprimer */}
                      <button
                        type="button"
                        onClick={() => handleDelete(col)}
                        disabled={!canDelete}
                        className={`p-1 rounded transition-colors ${
                          canDelete
                            ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            : "text-slate-600 cursor-not-allowed opacity-40"
                        }`}
                        title={
                          canDelete
                            ? "Supprimer la colonne"
                            : "Impossible de supprimer la dernière colonne pour ce statut"
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
