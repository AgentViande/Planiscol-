import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { DatabaseManager } from "../src/main/db/database";
import { KanbanColumn } from "../src/main/db/types";

describe("Règles Métier et Gestion des Colonnes Kanban Personnalisées", () => {
  let testUserDataDir: string;
  let db: DatabaseManager;

  beforeEach(() => {
    testUserDataDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "planiscol-kanban-cols-test-"),
    );
    db = new DatabaseManager(testUserDataDir);
  });

  afterEach(() => {
    try {
      fs.rmSync(testUserDataDir, { recursive: true, force: true });
    } catch {}
  });

  it("Possède 3 colonnes de base initiales rattachées à chaque statut", () => {
    const cols = db.getKanbanColumns();
    expect(cols.length).toBe(3);
    expect(cols.find((c) => c.baseStatus === "todo")).toBeDefined();
    expect(cols.find((c) => c.baseStatus === "in_progress")).toBeDefined();
    expect(cols.find((c) => c.baseStatus === "done")).toBeDefined();
  });

  it("Permet d’ajouter une nouvelle colonne personnalisée rattachée à un statut de base", () => {
    const currentCols = db.getKanbanColumns();
    const newCol: KanbanColumn = {
      id: "col-review",
      title: "À relire",
      baseStatus: "in_progress",
      orderIndex: currentCols.length,
      color: "#ec4899",
    };

    const updated = db.saveKanbanColumns([...currentCols, newCol]);
    expect(updated.length).toBe(4);
    expect(db.getKanbanColumns().some((c) => c.id === "col-review")).toBe(true);
  });

  it("Interdit de supprimer la dernière colonne d’un statut de base", () => {
    // Il n'y a qu'une seule colonne 'todo' ('col-todo')
    expect(() => {
      db.deleteKanbanColumn("col-todo");
    }).toThrow(
      /Impossible de supprimer la dernière colonne pour le statut "todo"/,
    );

    // Vérifier que la colonne n'a pas été supprimée
    expect(db.getKanbanColumns().some((c) => c.id === "col-todo")).toBe(true);
  });

  it("Permet de supprimer une colonne personnalisée si une autre colonne du même statut existe, et réassigne les tâches", () => {
    const currentCols = db.getKanbanColumns();
    // Ajouter une 2ème colonne 'in_progress'
    const extraCol: KanbanColumn = {
      id: "col-waiting",
      title: "En attente du prof",
      baseStatus: "in_progress",
      orderIndex: 3,
      color: "#f59e0b",
    };
    db.saveKanbanColumns([...currentCols, extraCol]);

    // Créer une tâche associée à cette colonne
    db.saveTask({
      id: "task-waiting-1",
      title: "Devoir de Physique en attente",
      type: "devoir",
      priority: "medium",
      status: "in_progress",
      columnId: "col-waiting",
      position: 0,
      orderIndex: 0,
      tags: [],
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Supprimer la colonne personnalisée
    const deleted = db.deleteKanbanColumn("col-waiting");
    expect(deleted).toBe(true);

    // Vérifier que la tâche a été réassignée à 'col-in-progress'
    const task = db.getTasks().find((t) => t.id === "task-waiting-1");
    expect(task).toBeDefined();
    expect(task?.columnId).toBe("col-in-progress");
    expect(task?.status).toBe("in_progress");
  });

  it("Rejette une sauvegarde globale si un des trois statuts de base est absent", () => {
    // Tenter de sauvegarder une liste sans aucune colonne 'done'
    const invalidCols: KanbanColumn[] = [
      { id: "c1", title: "À faire", baseStatus: "todo", orderIndex: 0 },
      { id: "c2", title: "En cours", baseStatus: "in_progress", orderIndex: 1 },
    ];

    expect(() => {
      db.saveKanbanColumns(invalidCols);
    }).toThrow(/Chaque statut de base.*doit avoir au moins une colonne active/);
  });
});
