import { create } from "zustand";
import {
  Task,
  Subtask,
  TaskAttachment,
  PriorityLevel,
  TaskType,
  TaskStatus,
  KanbanColumn,
} from "../types";
import confetti from "canvas-confetti";

const getApi = () => (typeof window !== "undefined" ? window.api : undefined);

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: "col-todo",
    title: "À faire",
    baseStatus: "todo",
    orderIndex: 0,
    color: "#6366f1",
  },
  {
    id: "col-in-progress",
    title: "En cours",
    baseStatus: "in_progress",
    orderIndex: 1,
    color: "#f59e0b",
  },
  {
    id: "col-done",
    title: "Terminé",
    baseStatus: "done",
    orderIndex: 2,
    color: "#10b981",
  },
];

export interface TaskFilterState {
  searchQuery: string;
  selectedSubjectIds: string[];
  selectedPriorities: PriorityLevel[];
  selectedTypes: TaskType[];
  selectedStatuses: TaskStatus[];
  selectedTags: string[];
  sortBy: "dueDate" | "priority" | "subject" | "status" | "createdAt";
  sortOrder: "asc" | "desc";
  groupBy: "smart" | "subject" | "priority" | "status" | "none";
  // Spécifique Kanban
  kanbanGroupBy: "none" | "subject" | "priority";
  hideCompletedOlderThan7Days: boolean;
  kanbanSortBy: "position" | "dueDate" | "priority";
}

interface HistoryEntry {
  action: string;
  tasks: Task[];
}

interface TaskState {
  tasks: Task[];
  kanbanColumns: KanbanColumn[];
  subtasks: Record<string, Subtask[]>;
  attachments: Record<string, TaskAttachment[]>;
  selectedTaskId: string | null;
  filters: TaskFilterState;
  isLoading: boolean;

  // Undo / Redo
  history: HistoryEntry[];
  future: HistoryEntry[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<void>;
  redo: () => Promise<void>;

  loadTasks: () => Promise<void>;
  loadKanbanColumns: () => Promise<void>;
  setSelectedTaskId: (id: string | null) => void;
  setFilters: (updates: Partial<TaskFilterState>) => void;
  resetFilters: () => void;

  saveTask: (task: Task) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;

  // Kanban & Déplacement
  moveTask: (
    taskId: string,
    targetColumnId: string,
    newPosition: number,
  ) => Promise<void>;
  reorderTasksInColumn: (columnId: string, taskIds: string[]) => Promise<void>;
  quickAddTask: (
    title: string,
    columnId?: string,
    subjectId?: string,
  ) => Promise<Task>;
  saveKanbanColumns: (cols: KanbanColumn[]) => Promise<void>;
  addKanbanColumn: (
    title: string,
    baseStatus: TaskStatus,
    color?: string,
  ) => Promise<KanbanColumn>;
  updateKanbanColumn: (
    id: string,
    updates: Partial<KanbanColumn>,
  ) => Promise<void>;
  deleteKanbanColumn: (id: string) => Promise<boolean>;

  // Sous-tâches
  loadSubtasks: (taskId: string) => Promise<Subtask[]>;
  addSubtask: (taskId: string, title: string) => Promise<Subtask>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;

  // Fichiers liés
  loadAttachments: (taskId: string) => Promise<TaskAttachment[]>;
  addAttachment: (
    taskId: string,
    filePath: string,
    fileName: string,
    fileType?: string,
    fileSize?: number,
  ) => Promise<TaskAttachment>;
  removeAttachment: (taskId: string, attachmentId: string) => Promise<void>;
  relocateAttachment: (
    taskId: string,
    attachmentId: string,
    newPath: string,
  ) => Promise<boolean>;

  getFilteredTasks: () => Task[];
  getKanbanTasks: (
    columnId: string,
    swimlaneKey?: string,
    swimlaneType?: "none" | "subject" | "priority",
  ) => Task[];
}

const DEFAULT_FILTERS: TaskFilterState = {
  searchQuery: "",
  selectedSubjectIds: [],
  selectedPriorities: [],
  selectedTypes: [],
  selectedStatuses: [],
  selectedTags: [],
  sortBy: "dueDate",
  sortOrder: "asc",
  groupBy: "smart",
  kanbanGroupBy: "none",
  hideCompletedOlderThan7Days: false,
  kanbanSortBy: "position",
};

const DEMO_TASKS: Task[] = [
  {
    id: "task-demo-1",
    title: "DM de Mathématiques : Dérivation & Tangentes",
    subjectId: "sub-maths",
    type: "devoir",
    priority: "high",
    status: "todo",
    columnId: "col-todo",
    position: 0,
    orderIndex: 0,
    dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    tags: ["dm", "algebre"],
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-demo-2",
    title: "Dissertation : L’art modifie-t-il notre rapport au monde ?",
    subjectId: "sub-francais",
    type: "devoir",
    priority: "medium",
    status: "in_progress",
    columnId: "col-in-progress",
    position: 0,
    orderIndex: 1,
    dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    tags: ["philo"],
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-demo-3",
    title: "Exposé d’Histoire : La chute du mur de Berlin",
    subjectId: "sub-histoire",
    type: "expose",
    priority: "medium",
    status: "todo",
    columnId: "col-todo",
    position: 1,
    orderIndex: 2,
    dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    tags: ["oral", "diaporama"],
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-demo-4",
    title: "Fiche de révision : La photosynthèse et la respiration cellulaire",
    subjectId: "sub-svt",
    type: "revision",
    priority: "high",
    status: "done",
    columnId: "col-done",
    position: 0,
    orderIndex: 3,
    tags: ["bac"],
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-demo-5",
    title: "TP n°4 : Dosage spectrophotométrique du permanganate",
    subjectId: "sub-physique",
    type: "projet",
    priority: "low",
    status: "in_progress",
    columnId: "col-in-progress",
    position: 1,
    orderIndex: 4,
    dueDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    tags: ["chimie"],
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEMO_SUBTASKS: Record<string, Subtask[]> = {
  "task-demo-1": [
    {
      id: "sub-1",
      taskId: "task-demo-1",
      title: "Calculer f'(x)",
      completed: true,
      orderIndex: 0,
    },
    {
      id: "sub-2",
      taskId: "task-demo-1",
      title: "Équation de la tangente en x=2",
      completed: false,
      orderIndex: 1,
    },
    {
      id: "sub-3",
      taskId: "task-demo-1",
      title: "Tableau de variation",
      completed: false,
      orderIndex: 2,
    },
  ],
};

const DEMO_ATTACHMENTS: Record<string, TaskAttachment[]> = {
  "task-demo-1": [
    {
      id: "att-1",
      taskId: "task-demo-1",
      filePath: "C:/Cours/Maths/DM1.pdf",
      fileName: "DM1_Derivation.pdf",
      isMissing: false,
      addedAt: "",
    },
  ],
  "task-demo-5": [
    {
      id: "att-2",
      taskId: "task-demo-5",
      filePath: "D:/TP/dosage.docx",
      fileName: "dosage_compte_rendu.docx",
      isMissing: true,
      addedAt: "",
    },
  ],
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: DEMO_TASKS,
  kanbanColumns: DEFAULT_KANBAN_COLUMNS,
  subtasks: DEMO_SUBTASKS,
  attachments: DEMO_ATTACHMENTS,
  selectedTaskId: null,
  filters: DEFAULT_FILTERS,
  isLoading: false,
  history: [],
  future: [],
  canUndo: false,
  canRedo: false,

  loadTasks: async (): Promise<void> => {
    try {
      const api = getApi();
      if (api) {
        const [fetchedTasks, fetchedCols] = await Promise.all([
          api.db.getTasks(),
          api.db.getKanbanColumns(),
        ]);
        set({
          tasks: fetchedTasks,
          kanbanColumns:
            fetchedCols && fetchedCols.length > 0
              ? fetchedCols
              : DEFAULT_KANBAN_COLUMNS,
          isLoading: false,
        });
      } else {
        set({
          tasks: get().tasks.length > 0 ? get().tasks : DEMO_TASKS,
          subtasks:
            Object.keys(get().subtasks).length > 0
              ? get().subtasks
              : DEMO_SUBTASKS,
          attachments:
            Object.keys(get().attachments).length > 0
              ? get().attachments
              : DEMO_ATTACHMENTS,
          isLoading: false,
        });
      }
    } catch (err) {
      console.error("Erreur chargement des tâches / colonnes:", err);
      set({ isLoading: false });
    }
  },

  loadKanbanColumns: async (): Promise<void> => {
    try {
      const api = getApi();
      if (api) {
        const fetched = await api.db.getKanbanColumns();
        if (fetched && fetched.length > 0) {
          set({ kanbanColumns: fetched });
        }
      }
    } catch (err) {
      console.error("Erreur chargement colonnes Kanban:", err);
    }
  },

  setSelectedTaskId: (id: string | null): void => {
    set({ selectedTaskId: id });
    if (id) {
      get().loadSubtasks(id);
      get().loadAttachments(id);
    }
  },

  setFilters: (updates: Partial<TaskFilterState>): void => {
    set((state) => ({ filters: { ...state.filters, ...updates } }));
  },

  resetFilters: (): void => {
    set({ filters: DEFAULT_FILTERS });
  },

  saveTask: async (task: Task): Promise<Task> => {
    let saved = task;
    const api = getApi();
    if (api) {
      saved = await api.db.saveTask(task);
    }
    const current = get().tasks;
    const index = current.findIndex((t) => t.id === saved.id);
    let updated: Task[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = saved;
    } else {
      updated = [saved, ...current];
    }
    set({ tasks: updated });
    return saved;
  },

  deleteTask: async (id: string): Promise<void> => {
    const currentTasks = get().tasks;
    const api = getApi();
    if (api) {
      await api.db.deleteTask(id);
    }
    set((state) => ({
      history: [
        { action: "delete_task", tasks: currentTasks },
        ...state.history.slice(0, 19),
      ],
      canUndo: true,
      future: [],
      canRedo: false,
      tasks: state.tasks.filter((t) => t.id !== id),
      selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
    }));
  },

  toggleTaskStatus: async (id: string): Promise<void> => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    const targetColumn = get().kanbanColumns.find(
      (c) => c.baseStatus === newStatus,
    );
    const newColId = targetColumn
      ? targetColumn.id
      : newStatus === "done"
        ? "col-done"
        : "col-todo";

    const updatedTask: Task = {
      ...task,
      status: newStatus,
      columnId: newColId,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === "done") {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#6366f1", "#10b981", "#3b82f6", "#f59e0b"],
        });
      } catch {
        // Safe fallback
      }
    }

    await get().saveTask(updatedTask);
  },

  // --- Déplacement & Réordonnancement Kanban ---
  moveTask: async (
    taskId: string,
    targetColumnId: string,
    newPosition: number,
  ): Promise<void> => {
    const { tasks, kanbanColumns, history } = get();
    const task = tasks.find((t) => t.id === taskId);
    const targetColumn = kanbanColumns.find((c) => c.id === targetColumnId);
    if (!task || !targetColumn) return;

    // Snapshot pour Undo
    const previousTasks = [...tasks];

    const oldStatus = task.status;
    const newStatus = targetColumn.baseStatus;
    const sourceColumnId =
      task.columnId ||
      (oldStatus === "done"
        ? "col-done"
        : oldStatus === "in_progress"
          ? "col-in-progress"
          : "col-todo");

    // Confetti si passage vers done
    if (newStatus === "done" && oldStatus !== "done") {
      try {
        confetti({
          particleCount: 45,
          spread: 70,
          origin: { y: 0.8 },
          colors: ["#6366f1", "#10b981", "#3b82f6", "#f59e0b"],
        });
      } catch {
        // ignore
      }
    }

    // Réorganisation des listes
    let updatedTasks = tasks.map((t) => ({ ...t }));

    if (sourceColumnId === targetColumnId) {
      // Même colonne : réordonnancement interne
      const colTasks = updatedTasks
        .filter(
          (t) =>
            (t.columnId ||
              (t.status === "done"
                ? "col-done"
                : t.status === "in_progress"
                  ? "col-in-progress"
                  : "col-todo")) === targetColumnId,
        )
        .sort((a, b) => a.position - b.position);

      const oldIndex = colTasks.findIndex((t) => t.id === taskId);
      if (oldIndex >= 0) {
        const [moved] = colTasks.splice(oldIndex, 1);
        const targetPos = Math.max(0, Math.min(newPosition, colTasks.length));
        colTasks.splice(targetPos, 0, moved);

        // Réassignation des positions
        colTasks.forEach((t, index) => {
          t.position = index;
          t.columnId = targetColumnId;
          t.status = newStatus;
          t.updatedAt = new Date().toISOString();
        });
      }
    } else {
      // Déplacement inter-colonnes
      const targetColTasks = updatedTasks
        .filter(
          (t) =>
            t.id !== taskId &&
            (t.columnId ||
              (t.status === "done"
                ? "col-done"
                : t.status === "in_progress"
                  ? "col-in-progress"
                  : "col-todo")) === targetColumnId,
        )
        .sort((a, b) => a.position - b.position);

      const sourceColTasks = updatedTasks
        .filter(
          (t) =>
            t.id !== taskId &&
            (t.columnId ||
              (t.status === "done"
                ? "col-done"
                : t.status === "in_progress"
                  ? "col-in-progress"
                  : "col-todo")) === sourceColumnId,
        )
        .sort((a, b) => a.position - b.position);

      const movedTask = updatedTasks.find((t) => t.id === taskId)!;
      movedTask.columnId = targetColumnId;
      movedTask.status = newStatus;
      movedTask.updatedAt = new Date().toISOString();

      const targetPos = Math.max(
        0,
        Math.min(newPosition, targetColTasks.length),
      );
      targetColTasks.splice(targetPos, 0, movedTask);

      // Réindexer la colonne cible
      targetColTasks.forEach((t, idx) => {
        t.position = idx;
      });

      // Réindexer l'ancienne colonne source
      sourceColTasks.forEach((t, idx) => {
        t.position = idx;
      });
    }

    // Mise à jour synchrone de l'état Zustand
    set({
      tasks: updatedTasks,
      history: [
        { action: "move_task", tasks: previousTasks },
        ...history.slice(0, 19),
      ],
      future: [],
      canUndo: true,
      canRedo: false,
    });

    // Persistance en base
    const api = getApi();
    if (api) {
      const updates = updatedTasks.map((t) => ({
        id: t.id,
        columnId: t.columnId,
        status: t.status,
        position: t.position,
      }));
      await api.db.reorderKanbanTasks(updates);
    }
  },

  reorderTasksInColumn: async (
    columnId: string,
    taskIds: string[],
  ): Promise<void> => {
    const { tasks, history } = get();
    const previousTasks = [...tasks];
    const updatedTasks = tasks.map((t) => {
      const newPos = taskIds.indexOf(t.id);
      if (newPos !== -1) {
        return {
          ...t,
          position: newPos,
          columnId,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    set({
      tasks: updatedTasks,
      history: [
        { action: "reorder_tasks", tasks: previousTasks },
        ...history.slice(0, 19),
      ],
      future: [],
      canUndo: true,
      canRedo: false,
    });

    const api = getApi();
    if (api) {
      const updates = taskIds.map((id, index) => ({
        id,
        columnId,
        position: index,
      }));
      await api.db.reorderKanbanTasks(updates);
    }
  },

  quickAddTask: async (
    title: string,
    columnId?: string,
    subjectId?: string,
  ): Promise<Task> => {
    const { kanbanColumns, tasks } = get();
    const targetCol =
      kanbanColumns.find((c) => c.id === columnId) ||
      kanbanColumns[0] ||
      DEFAULT_KANBAN_COLUMNS[0];
    const colTasks = tasks.filter(
      (t) => (t.columnId || "col-todo") === targetCol.id,
    );

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      type: "devoir",
      priority: "medium",
      status: targetCol.baseStatus,
      columnId: targetCol.id,
      position: colTasks.length,
      orderIndex: tasks.length,
      tags: [],
      subjectId: subjectId || undefined,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await get().saveTask(newTask);
  },

  undo: async (): Promise<void> => {
    const { history, tasks, future } = get();
    if (history.length === 0) return;

    const [lastAction, ...remainingHistory] = history;
    const currentTasks = [...tasks];

    set({
      tasks: lastAction.tasks,
      history: remainingHistory,
      future: [
        { action: lastAction.action, tasks: currentTasks },
        ...future.slice(0, 19),
      ],
      canUndo: remainingHistory.length > 0,
      canRedo: true,
    });

    const api = getApi();
    if (api) {
      const updates = lastAction.tasks.map((t) => ({
        id: t.id,
        columnId: t.columnId,
        status: t.status,
        position: t.position,
      }));
      await api.db.reorderKanbanTasks(updates);
    }
  },

  redo: async (): Promise<void> => {
    const { future, tasks, history } = get();
    if (future.length === 0) return;

    const [nextAction, ...remainingFuture] = future;
    const currentTasks = [...tasks];

    set({
      tasks: nextAction.tasks,
      future: remainingFuture,
      history: [
        { action: nextAction.action, tasks: currentTasks },
        ...history.slice(0, 19),
      ],
      canUndo: true,
      canRedo: remainingFuture.length > 0,
    });

    const api = getApi();
    if (api) {
      const updates = nextAction.tasks.map((t) => ({
        id: t.id,
        columnId: t.columnId,
        status: t.status,
        position: t.position,
      }));
      await api.db.reorderKanbanTasks(updates);
    }
  },

  // --- Gestion des colonnes personnalisées ---
  saveKanbanColumns: async (cols: KanbanColumn[]): Promise<void> => {
    set({ kanbanColumns: cols });
    const api = getApi();
    if (api) {
      await api.db.saveKanbanColumns(cols);
    }
  },

  addKanbanColumn: async (
    title: string,
    baseStatus: TaskStatus,
    color?: string,
  ): Promise<KanbanColumn> => {
    const { kanbanColumns } = get();
    const newCol: KanbanColumn = {
      id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      baseStatus,
      orderIndex: kanbanColumns.length,
      color:
        color ||
        (baseStatus === "done"
          ? "#10b981"
          : baseStatus === "in_progress"
            ? "#f59e0b"
            : "#6366f1"),
    };
    const updated = [...kanbanColumns, newCol];
    await get().saveKanbanColumns(updated);
    return newCol;
  },

  updateKanbanColumn: async (
    id: string,
    updates: Partial<KanbanColumn>,
  ): Promise<void> => {
    const { kanbanColumns } = get();
    const updated = kanbanColumns.map((c) =>
      c.id === id ? { ...c, ...updates } : c,
    );
    await get().saveKanbanColumns(updated);
  },

  deleteKanbanColumn: async (id: string): Promise<boolean> => {
    const { kanbanColumns, tasks } = get();
    const colToDelete = kanbanColumns.find((c) => c.id === id);
    if (!colToDelete) return false;

    const remainingOfStatus = kanbanColumns.filter(
      (c) => c.baseStatus === colToDelete.baseStatus && c.id !== id,
    );
    if (remainingOfStatus.length === 0) {
      return false;
    }

    const fallbackCol = remainingOfStatus[0];
    const updatedTasks = tasks.map((t) =>
      t.columnId === id ? { ...t, columnId: fallbackCol.id } : t,
    );
    const updatedCols = kanbanColumns.filter((c) => c.id !== id);

    set({ tasks: updatedTasks, kanbanColumns: updatedCols });

    const api = getApi();
    if (api) {
      await api.db.deleteKanbanColumn(id);
    }
    return true;
  },

  // --- Sous-tâches ---
  loadSubtasks: async (taskId: string): Promise<Subtask[]> => {
    try {
      const api = getApi();
      if (api) {
        const fetched = await api.db.getSubtasks(taskId);
        set((state) => ({
          subtasks: { ...state.subtasks, [taskId]: fetched },
        }));
        return fetched;
      }
    } catch (err) {
      console.error("Erreur chargement sous-tâches:", err);
    }
    return [];
  },

  addSubtask: async (taskId: string, title: string): Promise<Subtask> => {
    const currentList = get().subtasks[taskId] || [];
    const newSub: Subtask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      taskId,
      title,
      completed: false,
      orderIndex: currentList.length,
    };
    const updated = [...currentList, newSub];
    set((state) => ({ subtasks: { ...state.subtasks, [taskId]: updated } }));
    const api = getApi();
    if (api) {
      await api.db.saveSubtasks(taskId, updated);
    }
    return newSub;
  },

  toggleSubtask: async (taskId: string, subtaskId: string): Promise<void> => {
    const currentList = get().subtasks[taskId] || [];
    const updated = currentList.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st,
    );
    set((state) => ({ subtasks: { ...state.subtasks, [taskId]: updated } }));
    const api = getApi();
    if (api) {
      await api.db.saveSubtasks(taskId, updated);
    }
  },

  deleteSubtask: async (taskId: string, subtaskId: string): Promise<void> => {
    const currentList = get().subtasks[taskId] || [];
    const updated = currentList.filter((st) => st.id !== subtaskId);
    set((state) => ({ subtasks: { ...state.subtasks, [taskId]: updated } }));
    const api = getApi();
    if (api) {
      await api.db.saveSubtasks(taskId, updated);
    }
  },

  // --- Fichiers Liés (ZÉRO COPIE) ---
  loadAttachments: async (taskId: string): Promise<TaskAttachment[]> => {
    try {
      const api = getApi();
      if (api) {
        const fetched = await api.db.getAttachments(taskId);
        set((state) => ({
          attachments: { ...state.attachments, [taskId]: fetched },
        }));
        return fetched;
      }
    } catch (err) {
      console.error("Erreur chargement documents liés:", err);
    }
    return [];
  },

  addAttachment: async (
    taskId: string,
    filePath: string,
    fileName: string,
    fileType?: string,
    fileSize?: number,
  ): Promise<TaskAttachment> => {
    const newAtt: TaskAttachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      taskId,
      filePath,
      fileName,
      fileType: fileType || fileName.split(".").pop() || "file",
      fileSize,
      addedAt: new Date().toISOString(),
    };

    let saved = newAtt;
    const api = getApi();
    if (api) {
      saved = await api.db.addAttachment(newAtt);
    }

    set((state) => {
      const current = state.attachments[taskId] || [];
      return {
        attachments: { ...state.attachments, [taskId]: [...current, saved] },
      };
    });
    return saved;
  },

  removeAttachment: async (
    taskId: string,
    attachmentId: string,
  ): Promise<void> => {
    const api = getApi();
    if (api) {
      await api.db.removeAttachment(attachmentId);
    }
    set((state) => {
      const current = state.attachments[taskId] || [];
      return {
        attachments: {
          ...state.attachments,
          [taskId]: current.filter((a) => a.id !== attachmentId),
        },
      };
    });
  },

  relocateAttachment: async (
    taskId: string,
    attachmentId: string,
    newPath: string,
  ): Promise<boolean> => {
    let success = false;
    const api = getApi();
    if (api) {
      success = await api.db.relocateAttachment(attachmentId, newPath);
    }
    if (success) {
      await get().loadAttachments(taskId);
    }
    return success;
  },

  getFilteredTasks: (): Task[] => {
    const { tasks, filters } = get();
    let result = tasks.filter((t) => !t.isArchived);

    // Recherche
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }

    // Filtre Matières
    if (filters.selectedSubjectIds.length > 0) {
      result = result.filter(
        (t) => t.subjectId && filters.selectedSubjectIds.includes(t.subjectId),
      );
    }

    // Filtre Priorités
    if (filters.selectedPriorities.length > 0) {
      result = result.filter((t) =>
        filters.selectedPriorities.includes(t.priority),
      );
    }

    // Filtre Types
    if (filters.selectedTypes.length > 0) {
      result = result.filter((t) => filters.selectedTypes.includes(t.type));
    }

    // Filtre Statuts
    if (filters.selectedStatuses.length > 0) {
      result = result.filter((t) =>
        filters.selectedStatuses.includes(t.status),
      );
    }

    // Filtre Tags
    if (filters.selectedTags.length > 0) {
      result = result.filter((t) =>
        filters.selectedTags.some((tag) => t.tags.includes(tag)),
      );
    }

    // Masquage des tâches terminées depuis plus de 7 jours
    if (filters.hideCompletedOlderThan7Days) {
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 3600 * 1000,
      ).toISOString();
      result = result.filter((t) => {
        if (t.status === "done") {
          const date = t.updatedAt || t.createdAt;
          return date >= sevenDaysAgo;
        }
        return true;
      });
    }

    // Tri
    result.sort((a, b) => {
      if (filters.sortBy === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (filters.sortBy === "priority") {
        const order = { high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      }
      if (filters.sortBy === "status") {
        const order = { todo: 1, in_progress: 2, done: 3 };
        return order[a.status] - order[b.status];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (filters.sortOrder === "desc") {
      result.reverse();
    }

    return result;
  },

  getKanbanTasks: (
    columnId: string,
    swimlaneKey?: string,
    swimlaneType: "none" | "subject" | "priority" = "none",
  ): Task[] => {
    const { filters } = get();
    const allFiltered = get().getFilteredTasks();

    let columnTasks = allFiltered.filter((t) => {
      const taskColId =
        t.columnId ||
        (t.status === "done"
          ? "col-done"
          : t.status === "in_progress"
            ? "col-in-progress"
            : "col-todo");
      return taskColId === columnId;
    });

    if (swimlaneType === "subject" && swimlaneKey) {
      if (swimlaneKey === "__none__") {
        columnTasks = columnTasks.filter((t) => !t.subjectId);
      } else {
        columnTasks = columnTasks.filter((t) => t.subjectId === swimlaneKey);
      }
    } else if (swimlaneType === "priority" && swimlaneKey) {
      columnTasks = columnTasks.filter((t) => t.priority === swimlaneKey);
    }

    // Tri interne de la colonne
    columnTasks.sort((a, b) => {
      if (filters.kanbanSortBy === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (filters.kanbanSortBy === "priority") {
        const order = { high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      }
      // Par défaut : position manuelle
      return (a.position ?? 0) - (b.position ?? 0);
    });

    return columnTasks;
  },
}));
