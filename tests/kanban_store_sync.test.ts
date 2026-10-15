import { describe, it, expect, beforeEach } from "vitest";
import { useTaskStore } from "../src/renderer/src/stores/useTaskStore";
import { Task } from "../src/renderer/src/types";

describe("Synchronisation du Store Zustand Kanban & Déplacements", () => {
  beforeEach(() => {
    // Réinitialiser le store avec des tâches de test
    useTaskStore.setState({
      tasks: [
        {
          id: "task-1",
          title: "Exercices de Mathématiques",
          type: "devoir",
          priority: "high",
          status: "todo",
          columnId: "col-todo",
          position: 0,
          orderIndex: 0,
          tags: ["maths"],
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "task-2",
          title: "Dissertation de Français",
          type: "devoir",
          priority: "medium",
          status: "in_progress",
          columnId: "col-in-progress",
          position: 0,
          orderIndex: 1,
          tags: ["francais"],
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "task-3",
          title: "TP de Chimie",
          type: "projet",
          priority: "low",
          status: "done",
          columnId: "col-done",
          position: 0,
          orderIndex: 2,
          tags: ["chimie"],
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      history: [],
      future: [],
      canUndo: false,
      canRedo: false,
    });
  });

  it('Déplace une tâche vers la colonne "Terminé" et change instantanément son statut en "done"', async () => {
    const { moveTask } = useTaskStore.getState();

    // Déplacer task-1 de 'col-todo' vers 'col-done'
    await moveTask("task-1", "col-done", 0);

    const updatedTask = useTaskStore
      .getState()
      .tasks.find((t) => t.id === "task-1");
    expect(updatedTask).toBeDefined();
    expect(updatedTask?.columnId).toBe("col-done");
    expect(updatedTask?.status).toBe("done");
    expect(updatedTask?.position).toBe(0);

    // Vérifier la synchronisation avec la liste globale des tâches
    const filtered = useTaskStore.getState().getFilteredTasks();
    const inFiltered = filtered.find((t) => t.id === "task-1");
    expect(inFiltered?.status).toBe("done");
  });

  it('Déplace une tâche hors de la colonne "Terminé" et la rouvre en statut "todo" ou "in_progress"', async () => {
    const { moveTask } = useTaskStore.getState();

    // Déplacer task-3 (terminée) vers 'col-in-progress'
    await moveTask("task-3", "col-in-progress", 1);

    const updatedTask = useTaskStore
      .getState()
      .tasks.find((t) => t.id === "task-3");
    expect(updatedTask?.columnId).toBe("col-in-progress");
    expect(updatedTask?.status).toBe("in_progress");
  });

  it("Prend en charge l’annulation (Undo) et le rétablissement (Redo) des déplacements de cartes", async () => {
    const { moveTask, undo, redo } = useTaskStore.getState();

    expect(useTaskStore.getState().canUndo).toBe(false);

    // Déplacement
    await moveTask("task-1", "col-done", 0);
    expect(
      useTaskStore.getState().tasks.find((t) => t.id === "task-1")?.status,
    ).toBe("done");
    expect(useTaskStore.getState().canUndo).toBe(true);

    // Annuler (Undo)
    await undo();
    expect(
      useTaskStore.getState().tasks.find((t) => t.id === "task-1")?.status,
    ).toBe("todo");
    expect(
      useTaskStore.getState().tasks.find((t) => t.id === "task-1")?.columnId,
    ).toBe("col-todo");
    expect(useTaskStore.getState().canRedo).toBe(true);

    // Rétablir (Redo)
    await redo();
    expect(
      useTaskStore.getState().tasks.find((t) => t.id === "task-1")?.status,
    ).toBe("done");
    expect(
      useTaskStore.getState().tasks.find((t) => t.id === "task-1")?.columnId,
    ).toBe("col-done");
  });

  it("Crée rapidement une tâche directement dans une colonne avec le bon statut pré-appliqué", async () => {
    const { quickAddTask } = useTaskStore.getState();

    const created = await quickAddTask("Fiche de lecture", "col-in-progress");

    expect(created.title).toBe("Fiche de lecture");
    expect(created.columnId).toBe("col-in-progress");
    expect(created.status).toBe("in_progress");

    // Tâche présente dans le store
    const inStore = useTaskStore
      .getState()
      .tasks.find((t) => t.id === created.id);
    expect(inStore).toBeDefined();
    expect(inStore?.status).toBe("in_progress");
  });

  it("Réordonne les tâches au sein d’une même colonne et met à jour leurs positions", async () => {
    const { tasks, moveTask } = useTaskStore.getState();

    // Ajouter une seconde tâche dans col-todo
    const task4: Task = {
      id: "task-4",
      title: "Réviser le vocabulaire allemand",
      type: "revision",
      priority: "low",
      status: "todo",
      columnId: "col-todo",
      position: 1,
      orderIndex: 3,
      tags: [],
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useTaskStore.setState({ tasks: [...tasks, task4] });

    // Déplacer task-4 en position 0 dans col-todo
    await moveTask("task-4", "col-todo", 0);

    const updatedTasks = useTaskStore.getState().tasks;
    const t4 = updatedTasks.find((t) => t.id === "task-4");
    const t1 = updatedTasks.find((t) => t.id === "task-1");

    expect(t4?.position).toBe(0);
    expect(t1?.position).toBe(1);
  });
});
