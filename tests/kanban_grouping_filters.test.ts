import { describe, it, expect, beforeEach } from "vitest";
import { useTaskStore } from "../src/renderer/src/stores/useTaskStore";
import { Task } from "../src/renderer/src/types";

describe("Filtres, Tris et Swimlanes (Regroupement) Kanban", () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const eightDaysAgo = new Date(
    now.getTime() - 8 * 24 * 3600 * 1000,
  ).toISOString();

  const sampleTasks: Task[] = [
    {
      id: "task-svt",
      title: "Schéma de la cellule",
      subjectId: "sub-svt",
      type: "devoir",
      priority: "high",
      status: "todo",
      columnId: "col-todo",
      position: 1,
      orderIndex: 0,
      dueDate: "2026-10-25T14:00:00.000Z",
      tags: ["bio"],
      isArchived: false,
      createdAt: yesterday,
      updatedAt: yesterday,
    },
    {
      id: "task-maths",
      title: "Devoir Maison Trigonométrie",
      subjectId: "sub-maths",
      type: "devoir",
      priority: "medium",
      status: "todo",
      columnId: "col-todo",
      position: 0,
      orderIndex: 1,
      dueDate: "2026-10-20T10:00:00.000Z",
      tags: ["maths"],
      isArchived: false,
      createdAt: yesterday,
      updatedAt: yesterday,
    },
    {
      id: "task-done-recent",
      title: "Poésie apprise",
      subjectId: "sub-francais",
      type: "devoir",
      priority: "low",
      status: "done",
      columnId: "col-done",
      position: 0,
      orderIndex: 2,
      tags: [],
      isArchived: false,
      createdAt: yesterday,
      updatedAt: yesterday,
    },
    {
      id: "task-done-old",
      title: "Ancien devoir de rentrée",
      subjectId: "sub-histoire",
      type: "devoir",
      priority: "low",
      status: "done",
      columnId: "col-done",
      position: 1,
      orderIndex: 3,
      tags: [],
      isArchived: false,
      createdAt: eightDaysAgo,
      updatedAt: eightDaysAgo,
    },
  ];

  beforeEach(() => {
    useTaskStore.setState({
      tasks: sampleTasks,
      filters: {
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
      },
    });
  });

  it("Isole correctement les tâches par colonne en mode sans regroupement", () => {
    const todoTasks = useTaskStore
      .getState()
      .getKanbanTasks("col-todo", undefined, "none");
    expect(todoTasks.length).toBe(2);
    expect(todoTasks.map((t) => t.id)).toContain("task-svt");
    expect(todoTasks.map((t) => t.id)).toContain("task-maths");
  });

  it("Filtre les tâches par couloir swimlane de matière", () => {
    const mathsTasks = useTaskStore
      .getState()
      .getKanbanTasks("col-todo", "sub-maths", "subject");
    expect(mathsTasks.length).toBe(1);
    expect(mathsTasks[0].id).toBe("task-maths");

    const svtTasks = useTaskStore
      .getState()
      .getKanbanTasks("col-todo", "sub-svt", "subject");
    expect(svtTasks.length).toBe(1);
    expect(svtTasks[0].id).toBe("task-svt");
  });

  it("Filtre les tâches par couloir swimlane de priorité", () => {
    const highTasks = useTaskStore
      .getState()
      .getKanbanTasks("col-todo", "high", "priority");
    expect(highTasks.length).toBe(1);
    expect(highTasks[0].id).toBe("task-svt");

    const mediumTasks = useTaskStore
      .getState()
      .getKanbanTasks("col-todo", "medium", "priority");
    expect(mediumTasks.length).toBe(1);
    expect(mediumTasks[0].id).toBe("task-maths");
  });

  it("Trie les tâches dans la colonne par date d’échéance", () => {
    useTaskStore.getState().setFilters({ kanbanSortBy: "dueDate" });
    const sorted = useTaskStore
      .getState()
      .getKanbanTasks("col-todo", undefined, "none");

    // 20 octobre avant 25 octobre
    expect(sorted[0].id).toBe("task-maths");
    expect(sorted[1].id).toBe("task-svt");
  });

  it("Trie les tâches dans la colonne par niveau de priorité", () => {
    useTaskStore.getState().setFilters({ kanbanSortBy: "priority" });
    const sorted = useTaskStore
      .getState()
      .getKanbanTasks("col-todo", undefined, "none");

    // high (svt) avant medium (maths)
    expect(sorted[0].id).toBe("task-svt");
    expect(sorted[1].id).toBe("task-maths");
  });

  it("Masque les tâches terminées depuis plus de 7 jours quand l’option est activée", () => {
    useTaskStore.getState().setFilters({ hideCompletedOlderThan7Days: true });

    const doneTasks = useTaskStore
      .getState()
      .getKanbanTasks("col-done", undefined, "none");
    expect(doneTasks.some((t) => t.id === "task-done-recent")).toBe(true);
    expect(doneTasks.some((t) => t.id === "task-done-old")).toBe(false);
  });
});
