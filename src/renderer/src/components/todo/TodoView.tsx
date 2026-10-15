import React, { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  AlertCircle,
  Paperclip,
  CheckCircle2,
  Trash2,
  Columns3,
} from "lucide-react";
import { useTaskStore } from "../../stores/useTaskStore";
import { useSubjectStore } from "../../stores/useSubjectStore";
import { Task, PriorityLevel, TaskType } from "../../types";

interface TodoViewProps {
  onOpenCreateTask: () => void;
  onSelectTask: (taskId: string) => void;
  onNavigateToTab?: (tab: "todo" | "kanban" | "calendar") => void;
}

export const TodoView: React.FC<TodoViewProps> = ({
  onOpenCreateTask,
  onSelectTask,
  onNavigateToTab,
}) => {
  const {
    filters,
    setFilters,
    resetFilters,
    getFilteredTasks,
    toggleTaskStatus,
    deleteTask,
    subtasks,
    attachments,
  } = useTaskStore();
  const { subjects, getSubjectById } = useSubjectStore();
  const [showFilters, setShowFilters] = useState(false);

  const filteredTasks = getFilteredTasks();

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Découpage en sections intelligentes
  const overdueTasks = filteredTasks.filter((t) => {
    if (t.status === "done" || !t.dueDate) return false;
    return t.dueDate.split("T")[0] < todayStr;
  });

  const todayTasks = filteredTasks.filter((t) => {
    if (t.status === "done" || !t.dueDate) return false;
    return t.dueDate.split("T")[0] === todayStr;
  });

  const thisWeekTasks = filteredTasks.filter((t) => {
    if (t.status === "done" || !t.dueDate) return false;
    const d = t.dueDate.split("T")[0];
    if (d <= todayStr) return false;
    const taskDate = new Date(t.dueDate);
    const diffDays = (taskDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7;
  });

  const laterTasks = filteredTasks.filter((t) => {
    if (t.status === "done") return false;
    if (!t.dueDate) return true;
    const taskDate = new Date(t.dueDate);
    const diffDays = (taskDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diffDays > 7;
  });

  const completedTasks = filteredTasks.filter((t) => t.status === "done");

  const renderTaskCard = (task: Task) => {
    const subject = getSubjectById(task.subjectId);
    const taskSubs = subtasks[task.id] || [];
    const completedSubs = taskSubs.filter((s) => s.completed).length;
    const taskAtts = attachments[task.id] || [];
    const isOverdue =
      task.status !== "done" &&
      task.dueDate &&
      task.dueDate.split("T")[0] < todayStr;

    return (
      <div
        key={task.id}
        className="glass-panel p-3.5 rounded-xl hover:border-white/20 transition-all flex items-start justify-between gap-3 group relative select-none"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Checkbox */}
          <button
            onClick={() => toggleTaskStatus(task.id)}
            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              task.status === "done"
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "border-slate-600 hover:border-accent bg-slate-900/50"
            }`}
          >
            {task.status === "done" && <CheckCircle2 className="w-3.5 h-3.5" />}
          </button>

          {/* Content */}
          <div
            onClick={() => onSelectTask(task.id)}
            className="flex-1 cursor-pointer min-w-0"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-semibold transition-colors ${
                  task.status === "done"
                    ? "line-through text-slate-500"
                    : "text-slate-100 group-hover:text-accent"
                }`}
              >
                {task.title}
              </span>

              {/* Priority Badge */}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                  task.priority === "high"
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : task.priority === "medium"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                <span>
                  {task.priority === "high"
                    ? "🔴"
                    : task.priority === "medium"
                      ? "🟠"
                      : "🟢"}
                </span>
                <span className="capitalize">{task.priority}</span>
              </span>

              {/* Type Badge */}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 capitalize">
                {task.type}
              </span>
            </div>

            {/* Description Snippet */}
            {task.description && (
              <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                {task.description}
              </p>
            )}

            {/* Badges Bar */}
            <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-400">
              {subject && (
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="text-slate-300 font-medium">
                    {subject.name}
                  </span>
                </div>
              )}

              {task.dueDate && (
                <div
                  className={`flex items-center gap-1 ${
                    isOverdue ? "text-red-400 font-bold" : ""
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(task.dueDate).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}

              {taskSubs.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px]">
                    ☑ {completedSubs}/{taskSubs.length} (
                    {Math.round((completedSubs / taskSubs.length) * 100)}%)
                  </span>
                </div>
              )}

              {taskAtts.length > 0 && (
                <div className="flex items-center gap-1 text-indigo-400">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>
                    {taskAtts.length} doc{taskAtts.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all"
          title="Supprimer la tâche"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden p-6 space-y-4">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">
              Mes Tâches & Devoirs
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {filteredTasks.length} tâche{filteredTasks.length > 1 ? "s" : ""}{" "}
              au total
            </p>
          </div>

          {onNavigateToTab && (
            <div className="hidden sm:flex items-center p-1 bg-slate-900/80 rounded-xl border border-white/10 text-xs font-medium">
              <button
                onClick={() => onNavigateToTab("todo")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white font-semibold shadow-glow"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Liste</span>
              </button>
              <button
                onClick={() => onNavigateToTab("kanban")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => onNavigateToTab("calendar")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              placeholder="Rechercher une tâche..."
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Toggle Filter Panel */}
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

          {/* Create Task Button */}
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Tâche</span>
          </button>
        </div>
      </div>

      {/* Expanded Filters Bar */}
      {showFilters && (
        <div className="glass-panel p-4 rounded-xl space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Subject Selector */}
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

            {/* Priority Selector */}
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

            {/* Sort Options */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">
                Trier par
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({
                    sortBy: e.target.value as
                      "dueDate" | "priority" | "status" | "createdAt",
                  })
                }
                className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="dueDate">Date d'échéance</option>
                <option value="priority">Niveau de priorité</option>
                <option value="status">Statut de réalisation</option>
                <option value="createdAt">Date de création</option>
              </select>
            </div>

            {/* Reset Filters */}
            <button
              onClick={resetFilters}
              className="mt-4 text-xs text-slate-400 hover:text-white underline"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}

      {/* Task List / Smart Sections */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {filteredTasks.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-slate-400 text-sm font-medium">
              Aucune tâche trouvée
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Modifiez vos filtres ou créez une tâche avec le bouton "Nouvelle
              Tâche" ou Ctrl+Space.
            </p>
          </div>
        ) : (
          <>
            {/* 1. En retard */}
            {overdueTasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>En retard ({overdueTasks.length})</span>
                </div>
                <div className="space-y-2">
                  {overdueTasks.map(renderTaskCard)}
                </div>
              </div>
            )}

            {/* 2. Aujourd'hui */}
            {todayTasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                  <Calendar className="w-4 h-4" />
                  <span>Aujourd'hui ({todayTasks.length})</span>
                </div>
                <div className="space-y-2">
                  {todayTasks.map(renderTaskCard)}
                </div>
              </div>
            )}

            {/* 3. Cette semaine */}
            {thisWeekTasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Calendar className="w-4 h-4" />
                  <span>Cette semaine ({thisWeekTasks.length})</span>
                </div>
                <div className="space-y-2">
                  {thisWeekTasks.map(renderTaskCard)}
                </div>
              </div>
            )}

            {/* 4. Plus tard */}
            {laterTasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>Plus tard ({laterTasks.length})</span>
                </div>
                <div className="space-y-2">
                  {laterTasks.map(renderTaskCard)}
                </div>
              </div>
            )}

            {/* 5. Terminées */}
            {completedTasks.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terminées ({completedTasks.length})</span>
                </div>
                <div className="space-y-2 opacity-75">
                  {completedTasks.map(renderTaskCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
