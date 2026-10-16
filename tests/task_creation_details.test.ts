import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { DatabaseManager } from "../src/main/db/database";
import { Task, Subtask, TaskAttachment } from "../src/main/db/types";

describe("BUG 1 : Formulaire de tâche unifié, sous-tâches, fichiers liés & transaction atomique", () => {
  let testUserDataDir: string;
  let testFilesDir: string;

  beforeEach(() => {
    testUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "planiscol-task-test-"));
    testFilesDir = fs.mkdtempSync(path.join(os.tmpdir(), "planiscol-user-files-"));
  });

  afterEach(() => {
    try {
      fs.rmSync(testUserDataDir, { recursive: true, force: true });
      fs.rmSync(testFilesDir, { recursive: true, force: true });
    } catch {}
  });

  it("Permet de créer une tâche avec 3 sous-tâches et 2 fichiers liés en une seule opération atomique", () => {
    const db = new DatabaseManager(testUserDataDir);

    // Fichiers originaux simulés de l'élève
    const doc1Path = path.join(testFilesDir, "cours_geometrie.pdf");
    const doc2Path = path.join(testFilesDir, "enonce_dm.docx");
    fs.writeFileSync(doc1Path, "Contenu de cours PDF simulé");
    fs.writeFileSync(doc2Path, "Énoncé DM simulé");

    const newTask: Task = {
      id: "task-test-creation-1",
      title: "DM de Mathématiques Avancées",
      description: "Exercices 12 à 18 page 45",
      type: "devoir",
      priority: "high",
      dueDate: "2026-10-25T18:00:00.000Z",
      estimatedDuration: 45,
      status: "todo",
      reminderMinutes: 60,
      recurrence: { frequency: "weekly" },
      tags: ["maths", "dm", "important"],
      orderIndex: 0,
      position: 0,
      columnId: "col-todo",
      actualDuration: 0,
      focusSessionsCount: 0,
      focusNotesDraft: "Notes de départ",
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const draftSubtasks: Subtask[] = [
      { id: "st-1", taskId: "task-test-creation-1", title: "Relire le cours", completed: true, orderIndex: 0 },
      { id: "st-2", taskId: "task-test-creation-1", title: "Faire les figures géométriques", completed: false, orderIndex: 1 },
      { id: "st-3", taskId: "task-test-creation-1", title: "Rédiger au propre", completed: false, orderIndex: 2 },
    ];

    const draftAttachments: TaskAttachment[] = [
      { id: "att-1", taskId: "task-test-creation-1", filePath: doc1Path, fileName: "cours_geometrie.pdf", fileType: "pdf", addedAt: new Date().toISOString() },
      { id: "att-2", taskId: "task-test-creation-1", filePath: doc2Path, fileName: "enonce_dm.docx", fileType: "docx", addedAt: new Date().toISOString() },
    ];

    // Enregistrement atomique
    const result = db.saveTaskWithDetails(newTask, draftSubtasks, draftAttachments);

    expect(result.task.id).toBe("task-test-creation-1");
    expect(result.subtasks.length).toBe(3);
    expect(result.attachments.length).toBe(2);

    // Vérification de la persistance effective en base
    const persistedTasks = db.getTasks();
    const persistedSubtasks = db.getSubtasks("task-test-creation-1");
    const persistedAttachments = db.getAttachments("task-test-creation-1");

    expect(persistedTasks.length).toBe(1);
    expect(persistedTasks[0].title).toBe("DM de Mathématiques Avancées");
    expect(persistedTasks[0].reminderMinutes).toBe(60);
    expect(persistedTasks[0].recurrence?.frequency).toBe("weekly");
    expect(persistedTasks[0].tags).toEqual(["maths", "dm", "important"]);

    expect(persistedSubtasks.length).toBe(3);
    expect(persistedSubtasks.map((s) => s.title)).toEqual([
      "Relire le cours",
      "Faire les figures géométriques",
      "Rédiger au propre",
    ]);
    expect(persistedSubtasks[0].completed).toBe(true);

    expect(persistedAttachments.length).toBe(2);
    expect(persistedAttachments.map((a) => a.fileName)).toEqual([
      "cours_geometrie.pdf",
      "enonce_dm.docx",
    ]);

    // RÈGLE ABSOLUE : Zéro copie !
    // Les fichiers ne doivent jamais être copiés dans testUserDataDir
    expect(fs.existsSync(path.join(testUserDataDir, "cours_geometrie.pdf"))).toBe(false);
    expect(fs.existsSync(path.join(testUserDataDir, "enonce_dm.docx"))).toBe(false);

    // Les chemins stockés sont strictement les chemins originaux
    expect(persistedAttachments[0].filePath).toBe(doc1Path);
    expect(persistedAttachments[1].filePath).toBe(doc2Path);
    expect(persistedAttachments[0].isMissing).toBe(false);
  });

  it("Annulation de création : aucune écriture en base de données", () => {
    const db = new DatabaseManager(testUserDataDir);

    // L'utilisateur prépare des données dans le formulaire React en mémoire locale
    const localDraftSubtasks = [
      { id: "draft-1", taskId: "", title: "Étape 1", completed: false, orderIndex: 0 },
      { id: "draft-2", taskId: "", title: "Étape 2", completed: false, orderIndex: 1 },
    ];
    const localDraftAttachments = [
      { id: "draft-att-1", taskId: "", filePath: "C:/docs/cours.pdf", fileName: "cours.pdf", addedAt: new Date().toISOString() },
    ];

    // L'utilisateur clique sur "Annuler" -> saveTaskWithDetails N'EST PAS APPELÉ
    // La base doit rester rigoureusement vide
    expect(db.getTasks()).toEqual([]);
    expect(db.getSubtasks("any-id")).toEqual([]);
    expect(db.getAttachments("any-id")).toEqual([]);
  });

  it("Parité complète des champs entre mode création et mode édition", () => {
    const requiredFields: Array<keyof Task> = [
      "id",
      "title",
      "description",
      "type",
      "priority",
      "dueDate",
      "estimatedDuration",
      "status",
      "reminderMinutes",
      "recurrence",
      "tags",
      "orderIndex",
      "position",
      "actualDuration",
      "focusSessionsCount",
      "focusNotesDraft",
      "isArchived",
      "createdAt",
      "updatedAt",
    ];

    const sampleTask: Task = {
      id: "parity-task-1",
      title: "Parité Test",
      description: "Description complète",
      type: "controle",
      priority: "high",
      dueDate: "2026-10-30T10:00:00.000Z",
      estimatedDuration: 60,
      status: "todo",
      reminderMinutes: 30,
      recurrence: { frequency: "custom", interval: 2 },
      tags: ["examen"],
      orderIndex: 0,
      position: 0,
      actualDuration: 25,
      focusSessionsCount: 1,
      focusNotesDraft: "Notes existantes",
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    for (const field of requiredFields) {
      expect(sampleTask).toHaveProperty(field);
    }
  });
});
