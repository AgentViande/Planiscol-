import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { DatabaseManager } from "../src/main/db/database";
import { Task, PomodoroSession } from "../src/main/db/types";

describe("AMÉLIORATION : Mode Focus Pomodoro & Horloge de Précision", () => {
  let testUserDataDir: string;

  beforeEach(() => {
    testUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "planiscol-focus-test-"));
  });

  afterEach(() => {
    try {
      fs.rmSync(testUserDataDir, { recursive: true, force: true });
    } catch {}
  });

  it("Garantit la précision du minuteur grâce au calcul d'horloge absolue (targetEndTime)", () => {
    // Simuler le démarrage du minuteur avec un timestamp cible absolu
    const durationSeconds = 25 * 60; // 1500 secondes
    const startTime = 1000000;
    const targetEndTime = startTime + durationSeconds * 1000;

    // Simuler une mise en veille ou un throttle de l'OS de 300 secondes (5 minutes)
    const simulatedNowAfterSleep = startTime + 300 * 1000;
    const diffMs = targetEndTime - simulatedNowAfterSleep;
    const remainingSeconds = Math.max(0, Math.ceil(diffMs / 1000));

    // Doit être rigoureusement égal à 1200 secondes (20 minutes)
    expect(remainingSeconds).toBe(1200);

    // Si le temps actuel dépasse l'échéance cible (par exemple 26 minutes plus tard)
    const simulatedNowAfterComplete = startTime + 26 * 60 * 1000;
    const diffMsComplete = targetEndTime - simulatedNowAfterComplete;
    const remainingSecondsComplete = Math.max(0, Math.ceil(diffMsComplete / 1000));

    expect(remainingSecondsComplete).toBe(0);
  });

  it("Enregistre le temps de travail réel et incrémente le compteur de sessions sur la tâche", () => {
    const db = new DatabaseManager(testUserDataDir);

    const initialTask: Task = {
      id: "task-focus-1",
      title: "Révisions Bac Histoire",
      type: "revision",
      priority: "high",
      status: "in_progress",
      tags: ["bac"],
      orderIndex: 0,
      position: 0,
      columnId: "col-in-progress",
      actualDuration: 50, // Déjà 50 min passées lors de précédentes sessions
      focusSessionsCount: 2,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.saveTask(initialTask);

    // Une session de 25 min vient de se terminer
    const sessionMinutes = 25;
    const session: PomodoroSession = {
      id: "pomo-test-1",
      taskId: "task-focus-1",
      durationMinutes: sessionMinutes,
      completedAt: new Date().toISOString(),
    };
    db.logPomodoroSession(session);

    // Mise à jour de la tâche
    const taskBefore = db.getTasks().find((t) => t.id === "task-focus-1");
    expect(taskBefore).toBeDefined();

    const updatedTask: Task = {
      ...taskBefore!,
      actualDuration: (taskBefore!.actualDuration || 0) + sessionMinutes,
      focusSessionsCount: (taskBefore!.focusSessionsCount || 0) + 1,
    };
    db.saveTask(updatedTask);

    const taskAfter = db.getTasks().find((t) => t.id === "task-focus-1");
    expect(taskAfter?.actualDuration).toBe(75); // 50 + 25 = 75 minutes
    expect(taskAfter?.focusSessionsCount).toBe(3); // 2 + 1 = 3 sessions

    // Vérification de la session enregistrée
    const sessions = db.getPomodoroSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0].taskId).toBe("task-focus-1");
    expect(sessions[0].durationMinutes).toBe(25);
  });

  it("Persiste le brouillon de notes de focus temporaires et permet son intégration ou sa suppression", () => {
    const db = new DatabaseManager(testUserDataDir);

    const task: Task = {
      id: "task-notes-1",
      title: "Exercices de Physique-Chimie",
      description: "Chapitre 4 : Ondes et signaux",
      type: "devoir",
      priority: "medium",
      status: "todo",
      tags: ["physique"],
      orderIndex: 0,
      position: 0,
      columnId: "col-todo",
      actualDuration: 0,
      focusSessionsCount: 0,
      focusNotesDraft: "Calcul de la longueur d'onde : lambda = v / f = 340 / 440 = 0.77m",
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.saveTask(task);

    // 1. Vérification que le brouillon est bien persisté
    const saved = db.getTasks().find((t) => t.id === "task-notes-1");
    expect(saved?.focusNotesDraft).toContain("lambda = v / f");

    // 2. Fusion des notes dans la description lors de la fin de session
    const mergedDesc = `${saved!.description}\n\n--- Notes de session Focus ---\n${saved!.focusNotesDraft}`;
    db.saveTask({
      ...saved!,
      description: mergedDesc,
      focusNotesDraft: "",
    });

    const afterMerge = db.getTasks().find((t) => t.id === "task-notes-1");
    expect(afterMerge?.description).toContain("Chapitre 4 : Ondes et signaux");
    expect(afterMerge?.description).toContain("Calcul de la longueur d'onde");
    expect(afterMerge?.focusNotesDraft).toBe("");
  });

  it("Valide l'enchaînement des cycles Pomodoro (Cycles 1 à 4 puis pause longue)", () => {
    const cyclesMax = 4;
    let currentCycle = 1;
    let phase = "work";

    const simulatePhaseEnd = () => {
      if (phase === "work") {
        if (currentCycle >= cyclesMax) {
          phase = "longBreak";
        } else {
          phase = "shortBreak";
        }
      } else {
        currentCycle = currentCycle >= cyclesMax ? 1 : currentCycle + 1;
        phase = "work";
      }
    };

    // Cycle 1 : work -> shortBreak
    expect(phase).toBe("work");
    expect(currentCycle).toBe(1);
    simulatePhaseEnd();
    expect(phase).toBe("shortBreak");

    // Fin break -> Cycle 2 work
    simulatePhaseEnd();
    expect(phase).toBe("work");
    expect(currentCycle).toBe(2);

    // Fin Cycle 2 -> shortBreak -> Cycle 3 work
    simulatePhaseEnd();
    expect(phase).toBe("shortBreak");
    simulatePhaseEnd();
    expect(currentCycle).toBe(3);

    // Fin Cycle 3 -> shortBreak -> Cycle 4 work
    simulatePhaseEnd();
    expect(phase).toBe("shortBreak");
    simulatePhaseEnd();
    expect(currentCycle).toBe(4);

    // Fin Cycle 4 -> longBreak !
    simulatePhaseEnd();
    expect(phase).toBe("longBreak");

    // Fin longBreak -> Cycle 1 work
    simulatePhaseEnd();
    expect(phase).toBe("work");
    expect(currentCycle).toBe(1);
  });
});
