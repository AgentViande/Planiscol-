import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { DatabaseManager } from "../src/main/db/database";

describe("Base de données, Migrations & Sauvegardes rotatives", () => {
  let testUserDataDir: string;

  beforeEach(() => {
    testUserDataDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "planiscol-db-test-"),
    );
  });

  afterEach(() => {
    try {
      fs.rmSync(testUserDataDir, { recursive: true, force: true });
    } catch {}
  });

  it("Initialise la base avec le schéma V2, les matières et les colonnes Kanban par défaut", () => {
    const db = new DatabaseManager(testUserDataDir);
    const state = db.getState();

    expect(state.version).toBe(2);
    expect(state.subjects.length).toBeGreaterThan(0);
    expect(state.tasks).toEqual([]);
    expect(state.kanbanColumns.length).toBe(3);
    expect(state.kanbanColumns.map((c) => c.baseStatus)).toEqual([
      "todo",
      "in_progress",
      "done",
    ]);
    expect(fs.existsSync(path.join(testUserDataDir, "planiscol.json"))).toBe(
      true,
    );
  });

  it("Migre fidèlement une base de données V1 vers V2 sans perte de données", () => {
    // Simuler une base de données Planiscol V1 existante
    const v1Data = {
      version: 1,
      subjects: [
        {
          id: "sub-maths",
          name: "Mathématiques",
          category: "Sciences",
          color: "#3b82f6",
          createdAt: "2026-09-01T08:00:00.000Z",
          updatedAt: "2026-09-01T08:00:00.000Z",
        },
      ],
      tasks: [
        {
          id: "task-v1-1",
          title: "Exercice 42 page 108",
          subjectId: "sub-maths",
          type: "devoir",
          priority: "high",
          status: "todo",
          tags: ["algebre"],
          orderIndex: 0,
          isArchived: false,
          createdAt: "2026-09-02T10:00:00.000Z",
          updatedAt: "2026-09-02T10:00:00.000Z",
        },
        {
          id: "task-v1-2",
          title: "Contrôle blanc de maths",
          subjectId: "sub-maths",
          type: "controle",
          priority: "high",
          status: "done",
          tags: ["revision"],
          orderIndex: 1,
          isArchived: false,
          createdAt: "2026-09-01T09:00:00.000Z",
          updatedAt: "2026-09-03T16:00:00.000Z",
        },
      ],
      subtasks: [],
      attachments: [],
      timetableSlots: [],
      grades: [],
      pomodoroSessions: [],
      subjectNotes: [],
      settings: {
        theme: "dark",
        accentColor: "#6366f1",
        schoolLevel: "lycee",
        autoUpdate: true,
        closeToTray: true,
        launchAtStartup: false,
        reminderNotifications: true,
        onboardingCompleted: true,
        pomodoroWorkDuration: 25,
        pomodoroBreakDuration: 5,
      },
    };

    // Écrire directement le fichier planiscol.json en V1
    fs.writeFileSync(
      path.join(testUserDataDir, "planiscol.json"),
      JSON.stringify(v1Data, null, 2),
      "utf-8",
    );

    // Initialiser le DatabaseManager (qui doit exécuter la migration V1 -> V2)
    const db = new DatabaseManager(testUserDataDir);
    const state = db.getState();

    // Vérification de la migration
    expect(state.version).toBe(2);
    expect(state.kanbanColumns).toBeDefined();
    expect(state.kanbanColumns.length).toBe(3);

    // Vérifier qu'aucune tâche n'a été perdue et que position et columnId sont initialisés
    expect(state.tasks.length).toBe(2);

    const task1 = state.tasks.find((t) => t.id === "task-v1-1");
    expect(task1).toBeDefined();
    expect(task1?.title).toBe("Exercice 42 page 108");
    expect(task1?.position).toBe(0);
    expect(task1?.columnId).toBe("col-todo");
    expect(task1?.status).toBe("todo");

    const task2 = state.tasks.find((t) => t.id === "task-v1-2");
    expect(task2).toBeDefined();
    expect(task2?.title).toBe("Contrôle blanc de maths");
    expect(task2?.position).toBe(1);
    expect(task2?.columnId).toBe("col-done");
    expect(task2?.status).toBe("done");
  });

  it("Génère et fait tourner les sauvegardes rotatives automatiques (max 10)", () => {
    const db = new DatabaseManager(testUserDataDir);
    const backupDir = path.join(testUserDataDir, "backups");

    // Génère 12 snapshots successifs
    for (let i = 0; i < 12; i++) {
      db.createBackupSnapshot();
    }

    const backupFiles = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith("planiscol_backup_") && f.endsWith(".json"));

    // Ne doit pas dépasser 10 sauvegardes
    expect(backupFiles.length).toBeLessThanOrEqual(10);
  });

  it("Exporte et réimporte les données avec intégrité (.planiscol)", () => {
    const db = new DatabaseManager(testUserDataDir);
    db.saveTask({
      id: "task-export-1",
      title: "Devoir de SVT",
      type: "devoir",
      priority: "high",
      status: "todo",
      tags: ["bio"],
      orderIndex: 0,
      position: 0,
      columnId: "col-todo",
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const exported = db.exportData();
    expect(exported).toContain("Devoir de SVT");
    expect(exported).toContain("planiscol");

    // Réinitialise une autre base et importe
    const newDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "planiscol-import-test-"),
    );
    const newDb = new DatabaseManager(newDir);
    const imported = newDb.importData(exported);

    expect(imported).toBe(true);
    expect(newDb.getTasks().some((t) => t.title === "Devoir de SVT")).toBe(
      true,
    );
    expect(newDb.getState().version).toBe(2);

    fs.rmSync(newDir, { recursive: true, force: true });
  });
});
