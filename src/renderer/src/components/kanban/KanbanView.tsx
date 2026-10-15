import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  Search,
  Filter,
  Plus,
  Undo2,
  Redo2,
  Layers,
  ArrowUpDown,
  SlidersHorizontal,
  EyeOff,
  CheckSquare,
  Columns3,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useTaskStore } from "../../stores/useTaskStore";
import { useSubjectStore } from "../../stores/useSubjectStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { PriorityLevel, Task } from "../../types";
import { KanbanColumnView } from "./KanbanColumnView";
import { KanbanCard } from "./KanbanCard";
import { KanbanColumnModal } from "./KanbanColumnModal";

interface KanbanViewProps {
  onOpenCreateTask: () => void;
  onSelectTask: (taskId: string) => void;
  onNavigateToTab: (tab: "todo" | "kanban" | "calendar") => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  onOpenCreateTask,
  onSelectTask,
  onNavigateToTab,
}) => {
  const {
    tasks,
    kanbanColumns,
    filters,
    setFilters,
    resetFilters,
    getKanbanTasks,
    moveTask,
    quickAddTask,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTaskStore();

  const { subjects } = useSubjectStore();
  const { settings, updateSettings } = useSettingsStore();

  const [showFilters, setShowFilters] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Initialisation des préférences locales Kanban
  useEffect(() => {
    if (settings.kanbanGroupBy) {
      setFilters({ kanbanGroupBy: settings.kanbanGroupBy });
    }
    if (settings.kanbanHideCompletedOld !== undefined) {
      setFilters({
        hideCompletedOlderThan7Days: settings.kanbanHideCompletedOld,
      });
    }
    if (settings.kanbanSortBy) {
      setFilters({ kanbanSortBy: settings.kanbanSortBy });
    }
  }, []);

  // Raccourcis clavier Ctrl+Z / Ctrl+Y pour Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si on est dans un champ de saisie
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          if (canRedo) redo();
        } else {
          e.preventDefault();
          if (canUndo) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  // Capteurs DndKit avec seuil d'activation 4px pour éviter de déclencher le drag lors d'un simple clic
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = String(event.active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Permet un suivi réactif fluide
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // La tâche traînée
    const currentTask = tasks.find((t) => t.id === activeId);
    if (!currentTask) return;

    // 1. Dépose directe sur le conteneur d'une colonne
    const targetCol = kanbanColumns.find((c) => c.id === overId);
    if (targetCol) {
      const colTasks = getKanbanTasks(
        targetCol.id,
        undefined,
        filters.kanbanGroupBy,
      );
      await moveTask(activeId, targetCol.id, colTasks.length);
      return;
    }

    // 2. Dépose sur une autre carte
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      const overColId =
        overTask.columnId ||
        (overTask.status === "done"
          ? "col-done"
          : overTask.status === "in_progress"
            ? "col-in-progress"
            : "col-todo");

      const targetColTasks = getKanbanTasks(
        overColId,
        undefined,
        filters.kanbanGroupBy,
      );
      const overIndex = targetColTasks.findIndex((t) => t.id === overId);
      const targetPos = overIndex >= 0 ? overIndex : targetColTasks.length;

      await moveTask(activeId, overColId, targetPos);
    }
  };

  // Gestion des Swimlanes
  const swimlaneType = filters.kanbanGroupBy || "none";

  const swimlanes: Array<{ key: string; title: string; color?: string }> = [];
  if (swimlaneType === "subject") {
    // Matières avec au moins une tâche filtrée ou existante
    subjects.forEach((s) => {
      swimlanes.push({ key: s.id, title: s.name, color: s.color });
    });
    swimlanes.push({
      key: "__none__",
      title: "Sans matière associée",
      color: "#94a3b8",
    });
  } else if (swimlaneType === "priority") {
    swimlanes.push({
      key: "high",
      title: "🔴 Priorité Haute",
      color: "#ef4444",
    });
    swimlanes.push({
      key: "medium",
      title: "🟠 Priorité Moyenne",
      color: "#f59e0b",
    });
    swimlanes.push({
      key: "low",
      title: "🟢 Priorité Basse",
      color: "#10b981",
    });
  }

  const sortedColumns = [...kanbanColumns].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );

  return (
    <div className="h-full flex flex-col overflow-hidden p-6 space-y-4">
      {/* 1. Top Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Tableau Kanban</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {tasks.length} tâche{tasks.length > 1 ? "s" : ""} au total •
              Glissez-déposez pour changer d'état
            </p>
          </div>

          {/* View Switcher Tabs (To-do / Kanban / Agenda) */}
          <div className="hidden sm:flex items-center p-1 bg-slate-900/80 rounded-xl border border-white/10 text-xs font-medium">
            <button
              onClick={() => onNavigateToTab("todo")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Liste</span>
            </button>
            <button
              onClick={() => onNavigateToTab("kanban")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white font-semibold shadow-glow"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => onNavigateToTab("calendar")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              placeholder="Rechercher une tâche..."
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Regrouper par (Swimlanes) */}
          <div className="flex items-center bg-slate-900/80 border border-white/10 rounded-xl px-2 py-1 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <select
              value={filters.kanbanGroupBy}
              onChange={(e) => {
                const val = e.target.value as "none" | "subject" | "priority";
                setFilters({ kanbanGroupBy: val });
                updateSettings({ kanbanGroupBy: val });
              }}
              className="bg-transparent text-slate-200 text-xs focus:outline-none font-medium cursor-pointer"
              title="Regrouper en couloirs (Swimlanes)"
            >
              <option value="none" className="bg-slate-900 text-white">
                Sans regroupement
              </option>
              <option value="subject" className="bg-slate-900 text-white">
                Par Matière
              </option>
              <option value="priority" className="bg-slate-900 text-white">
                Par Priorité
              </option>
            </select>
          </div>

          {/* Tri interne */}
          <div className="flex items-center bg-slate-900/80 border border-white/10 rounded-xl px-2 py-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <select
              value={filters.kanbanSortBy}
              onChange={(e) => {
                const val = e.target.value as
                  "position" | "dueDate" | "priority";
                setFilters({ kanbanSortBy: val });
                updateSettings({ kanbanSortBy: val });
              }}
              className="bg-transparent text-slate-200 text-xs focus:outline-none font-medium cursor-pointer"
              title="Tri dans chaque colonne"
            >
              <option value="position" className="bg-slate-900 text-white">
                Tri manuel
              </option>
              <option value="dueDate" className="bg-slate-900 text-white">
                Par échéance
              </option>
              <option value="priority" className="bg-slate-900 text-white">
                Par priorité
              </option>
            </select>
          </div>

          {/* Bouton Masquer Tâches Terminées (+7 jours) */}
          <button
            onClick={() => {
              const nextVal = !filters.hideCompletedOlderThan7Days;
              setFilters({ hideCompletedOlderThan7Days: nextVal });
              updateSettings({ kanbanHideCompletedOld: nextVal });
            }}
            className={`p-2 rounded-xl border transition-colors ${
              filters.hideCompletedOlderThan7Days
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            title={
              filters.hideCompletedOlderThan7Days
                ? "Tâches terminées depuis +7 jours masquées"
                : "Masquer les tâches terminées depuis plus de 7 jours"
            }
          >
            <EyeOff className="w-4 h-4" />
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-white/10 rounded-xl p-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-20"
              title="Annuler le déplacement (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-20"
              title="Rétablir le déplacement (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Filters Panel */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-colors ${
              showFilters
                ? "bg-accent/20 border-accent text-accent"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
            title="Filtrer"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Personnaliser les colonnes */}
          <button
            onClick={() => setIsColumnModalOpen(true)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Gérer et personnaliser les colonnes"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Nouvelle Tâche */}
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle Tâche</span>
          </button>
        </div>
      </div>

      {/* 2. Expanded Filters Bar (Réutilisation des filtres existants) */}
      {showFilters && (
        <div className="glass-panel p-4 rounded-xl space-y-3 shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            {/* Matière */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">
                Matière
              </label>
              <select
                value={filters.selectedSubjectIds[0] || ""}
                onChange={(e) =>
                  setFilters({
                    selectedSubjectIds: e.target.value ? [e.target.value] : [],
                  })
                }
                className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="">Toutes les matières</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priorité */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">
                Priorité
              </label>
              <div className="flex items-center gap-1">
                {(["high", "medium", "low"] as PriorityLevel[]).map((p) => {
                  const isSelected = filters.selectedPriorities.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        const newP = isSelected
                          ? filters.selectedPriorities.filter((x) => x !== p)
                          : [...filters.selectedPriorities, p];
                        setFilters({ selectedPriorities: newP });
                      }}
                      className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected
                          ? "bg-accent/20 border-accent text-accent"
                          : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {p === "high"
                        ? "🔴 Haute"
                        : p === "medium"
                          ? "🟠 Moyenne"
                          : "🟢 Basse"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={resetFilters}
              className="mt-4 text-xs text-slate-400 hover:text-white underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}

      {/* 3. Plateau Kanban avec Glisser-Déposer */}
      <div className="flex-1 overflow-x-auto overflow-y-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {swimlaneType === "none" ? (
            /* Mode Standard : Colonnes verticales côte à côte */
            <div className="flex items-start gap-4 h-full min-w-max pb-2">
              {sortedColumns.map((col) => {
                const colTasks = getKanbanTasks(col.id, undefined, "none");
                return (
                  <KanbanColumnView
                    key={col.id}
                    column={col}
                    tasks={colTasks}
                    onSelectTask={onSelectTask}
                    onQuickAdd={(title) => quickAddTask(title, col.id)}
                  />
                );
              })}
            </div>
          ) : (
            /* Mode Swimlanes : Rangées horizontales par Matière ou Priorité */
            <div className="space-y-6 min-w-max pb-4">
              {swimlanes.map((lane) => {
                // Vérifier s'il y a des tâches dans cette ligne
                const totalInLane = sortedColumns.reduce((acc, col) => {
                  return (
                    acc + getKanbanTasks(col.id, lane.key, swimlaneType).length
                  );
                }, 0);

                return (
                  <div
                    key={lane.key}
                    className="space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/5"
                  >
                    {/* En-tête de la swimlane */}
                    <div className="flex items-center gap-2 px-1 select-none">
                      {lane.color && (
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: lane.color }}
                        />
                      )}
                      <h3 className="font-semibold text-sm text-slate-200">
                        {lane.title}
                      </h3>
                      <span className="text-xs text-slate-500 font-mono">
                        ({totalInLane} tâche{totalInLane > 1 ? "s" : ""})
                      </span>
                    </div>

                    {/* Colonnes de la swimlane */}
                    <div className="flex items-start gap-4">
                      {sortedColumns.map((col) => {
                        const colTasks = getKanbanTasks(
                          col.id,
                          lane.key,
                          swimlaneType,
                        );
                        return (
                          <KanbanColumnView
                            key={`${lane.key}-${col.id}`}
                            column={col}
                            tasks={colTasks}
                            onSelectTask={onSelectTask}
                            onQuickAdd={(title) =>
                              quickAddTask(
                                title,
                                col.id,
                                swimlaneType === "subject" &&
                                  lane.key !== "__none__"
                                  ? lane.key
                                  : undefined,
                              )
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Carte volante pendant le déplacement */}
          <DragOverlay>
            {activeTask ? (
              <KanbanCard task={activeTask} onSelectTask={() => {}} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modale de personnalisation des colonnes */}
      <KanbanColumnModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
      />
    </div>
  );
};
