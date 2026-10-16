import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
import {
  PlaniscolDatabaseState,
  Subject,
  Task,
  Subtask,
  TaskAttachment,
  TimetableSlot,
  Grade,
  PomodoroSession,
  SubjectNote,
  UserSettings,
  KanbanColumn,
} from "./types";
import {
  DEFAULT_SETTINGS,
  getDefaultSubjects,
  DEFAULT_KANBAN_COLUMNS,
} from "./seed";

export class DatabaseManager {
  private dbPath: string;
  private backupDir: string;
  private state: PlaniscolDatabaseState;

  constructor(customPath?: string) {
    const userData =
      customPath ||
      (app ? app.getPath("userData") : path.join(process.cwd(), "userData"));
    this.backupDir = path.join(userData, "backups");
    this.dbPath = path.join(userData, "planiscol.json");

    if (!fs.existsSync(userData)) {
      fs.mkdirSync(userData, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    this.state = this.loadDatabase();
  }

  private getInitialState(): PlaniscolDatabaseState {
    return {
      version: 3,
      subjects: getDefaultSubjects("lycee"),
      tasks: [],
      subtasks: [],
      attachments: [],
      timetableSlots: [],
      grades: [],
      pomodoroSessions: [],
      subjectNotes: [],
      settings: { ...DEFAULT_SETTINGS },
      kanbanColumns: [...DEFAULT_KANBAN_COLUMNS],
    };
  }

  private loadDatabase(): PlaniscolDatabaseState {
    if (!fs.existsSync(this.dbPath)) {
      const initial = this.getInitialState();
      this.saveAtomic(initial);
      this.createBackupSnapshot(initial);
      return initial;
    }

    try {
      const raw = fs.readFileSync(this.dbPath, "utf-8");
      const data: PlaniscolDatabaseState = JSON.parse(raw);
      const migrated = this.runMigrations(data);
      return migrated;
    } catch (err) {
      console.error(
        "Erreur lors de la lecture de la base de données. Tentative de restauration depuis un backup...",
        err,
      );
      const restored = this.restoreLatestBackup();
      if (restored) return restored;

      const initial = this.getInitialState();
      this.saveAtomic(initial);
      return initial;
    }
  }

  private runMigrations(data: PlaniscolDatabaseState): PlaniscolDatabaseState {
    let currentVersion = data.version || 0;

    // Migration V1: Structure initiale de Planiscol
    if (currentVersion < 1) {
      data.version = 1;
      data.subjects = data.subjects || getDefaultSubjects("lycee");
      data.tasks = data.tasks || [];
      data.subtasks = data.subtasks || [];
      data.attachments = data.attachments || [];
      data.timetableSlots = data.timetableSlots || [];
      data.grades = data.grades || [];
      data.pomodoroSessions = data.pomodoroSessions || [];
      data.subjectNotes = data.subjectNotes || [];
      data.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
      currentVersion = 1;
      this.saveAtomic(data);
    }

    // Migration V2: Colonnes Kanban & champ position sur les tâches
    if (currentVersion < 2) {
      data.version = 2;
      if (!data.kanbanColumns || data.kanbanColumns.length === 0) {
        data.kanbanColumns = [...DEFAULT_KANBAN_COLUMNS];
      }
      data.tasks = (data.tasks || []).map((t, idx) => {
        let colId = t.columnId;
        if (!colId) {
          if (t.status === "done") colId = "col-done";
          else if (t.status === "in_progress") colId = "col-in-progress";
          else colId = "col-todo";
        }
        return {
          ...t,
          position:
            typeof t.position === "number"
              ? t.position
              : typeof t.orderIndex === "number"
                ? t.orderIndex
                : idx,
          columnId: colId,
        };
      });
      currentVersion = 2;
      this.saveAtomic(data);
    }

    // Migration V3: Mode Focus Pomodoro & suivi du temps réel
    if (currentVersion < 3) {
      data.version = 3;
      data.tasks = (data.tasks || []).map((t) => ({
        ...t,
        actualDuration: typeof t.actualDuration === "number" ? t.actualDuration : 0,
        focusSessionsCount: typeof t.focusSessionsCount === "number" ? t.focusSessionsCount : 0,
        focusNotesDraft: t.focusNotesDraft || "",
      }));
      data.settings = {
        ...DEFAULT_SETTINGS,
        ...(data.settings || {}),
        pomodoroLongBreakDuration:
          data.settings?.pomodoroLongBreakDuration ?? DEFAULT_SETTINGS.pomodoroLongBreakDuration,
        pomodoroCyclesBeforeLongBreak:
          data.settings?.pomodoroCyclesBeforeLongBreak ?? DEFAULT_SETTINGS.pomodoroCyclesBeforeLongBreak,
        pomodoroSoundEnabled:
          data.settings?.pomodoroSoundEnabled ?? DEFAULT_SETTINGS.pomodoroSoundEnabled,
        pomodoroSilentMode:
          data.settings?.pomodoroSilentMode ?? DEFAULT_SETTINGS.pomodoroSilentMode,
        fullScreenFocus:
          data.settings?.fullScreenFocus ?? DEFAULT_SETTINGS.fullScreenFocus,
      };
      currentVersion = 3;
      this.saveAtomic(data);
    }

    return data;
  }

  private saveAtomic(data: PlaniscolDatabaseState): void {
    const tmpPath = `${this.dbPath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpPath, this.dbPath);
  }

  public save(): void {
    this.saveAtomic(this.state);
  }

  public createBackupSnapshot(dataToSave?: PlaniscolDatabaseState): string {
    const data = dataToSave || this.state;
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `planiscol_backup_${dateStr}.json`;
    const filePath = path.join(this.backupDir, filename);

    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      this.rotateBackups(10);
      return filePath;
    } catch (err) {
      console.error("Erreur lors de la création du backup:", err);
      return "";
    }
  }

  private rotateBackups(maxBackups: number = 10): void {
    try {
      const files = fs
        .readdirSync(this.backupDir)
        .filter((f) => f.startsWith("planiscol_backup_") && f.endsWith(".json"))
        .map((f) => ({
          name: f,
          path: path.join(this.backupDir, f),
          time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > maxBackups) {
        for (const file of files.slice(maxBackups)) {
          fs.unlinkSync(file.path);
        }
      }
    } catch (err) {
      console.error("Erreur lors de la rotation des backups:", err);
    }
  }

  private restoreLatestBackup(): PlaniscolDatabaseState | null {
    try {
      if (!fs.existsSync(this.backupDir)) return null;
      const files = fs
        .readdirSync(this.backupDir)
        .filter((f) => f.startsWith("planiscol_backup_") && f.endsWith(".json"))
        .map((f) => ({
          name: f,
          path: path.join(this.backupDir, f),
          time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 0) {
        const raw = fs.readFileSync(files[0].path, "utf-8");
        const restored: PlaniscolDatabaseState = JSON.parse(raw);
        this.saveAtomic(restored);
        return restored;
      }
    } catch (err) {
      console.error("Erreur lors de la restauration du backup:", err);
    }
    return null;
  }

  // --- API Transactionnelle et d'Accès ---

  public getState(): PlaniscolDatabaseState {
    return this.state;
  }

  public getSettings(): UserSettings {
    return this.state.settings;
  }

  public updateSettings(updates: Partial<UserSettings>): UserSettings {
    this.state.settings = { ...this.state.settings, ...updates };
    this.save();
    return this.state.settings;
  }

  public setSchoolLevel(level: "college" | "lycee" | "superieur"): void {
    this.state.settings.schoolLevel = level;
    this.state.settings.onboardingCompleted = true;
    this.state.subjects = getDefaultSubjects(level);
    this.save();
  }

  // --- Subjects ---
  public getSubjects(): Subject[] {
    return this.state.subjects;
  }

  public saveSubject(subject: Subject): Subject {
    const index = this.state.subjects.findIndex((s) => s.id === subject.id);
    if (index >= 0) {
      this.state.subjects[index] = {
        ...subject,
        updatedAt: new Date().toISOString(),
      };
    } else {
      this.state.subjects.push({
        ...subject,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.save();
    return subject;
  }

  public deleteSubject(id: string): boolean {
    this.state.subjects = this.state.subjects.filter((s) => s.id !== id);
    // Détache les tâches associées plutôt que de les supprimer
    this.state.tasks = this.state.tasks.map((t) =>
      t.subjectId === id ? { ...t, subjectId: undefined } : t,
    );
    this.save();
    return true;
  }

  // --- Tasks ---
  public getTasks(): Task[] {
    return this.state.tasks;
  }

  public saveTask(task: Task): Task {
    const index = this.state.tasks.findIndex((t) => t.id === task.id);
    const taskWithDefaults: Task = {
      ...task,
      position:
        typeof task.position === "number"
          ? task.position
          : typeof task.orderIndex === "number"
            ? task.orderIndex
            : 0,
      columnId:
        task.columnId ||
        (task.status === "done"
          ? "col-done"
          : task.status === "in_progress"
            ? "col-in-progress"
            : "col-todo"),
    };

    if (index >= 0) {
      this.state.tasks[index] = {
        ...taskWithDefaults,
        updatedAt: new Date().toISOString(),
      };
    } else {
      this.state.tasks.push({
        ...taskWithDefaults,
        createdAt: task.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.save();
    return index >= 0 ? this.state.tasks[index] : taskWithDefaults;
  }

  public saveTaskWithDetails(
    task: Task,
    subtasks: Subtask[],
    attachments: TaskAttachment[],
  ): { task: Task; subtasks: Subtask[]; attachments: TaskAttachment[] } {
    // 1. Sauvegarde de la tâche
    const savedTask = this.saveTask(task);

    // 2. Remplacement transactionnel des sous-tâches
    const normalizedSubtasks: Subtask[] = subtasks.map((st, idx) => ({
      ...st,
      id: st.id || `st-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      taskId: savedTask.id,
      orderIndex: typeof st.orderIndex === "number" ? st.orderIndex : idx,
    }));
    this.state.subtasks = this.state.subtasks
      .filter((st) => st.taskId !== savedTask.id)
      .concat(normalizedSubtasks);

    // 3. Remplacement transactionnel des documents liés (ZÉRO COPIE)
    const normalizedAttachments: TaskAttachment[] = attachments.map((att, idx) => {
      const exists = fs.existsSync(att.filePath);
      const stat = exists ? fs.statSync(att.filePath) : undefined;
      return {
        ...att,
        id: att.id || `att-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
        taskId: savedTask.id,
        fileSize: stat ? stat.size : att.fileSize,
        isMissing: !exists,
        addedAt: att.addedAt || new Date().toISOString(),
      };
    });
    this.state.attachments = this.state.attachments
      .filter((att) => att.taskId !== savedTask.id)
      .concat(normalizedAttachments);

    this.save();
    return {
      task: savedTask,
      subtasks: normalizedSubtasks,
      attachments: normalizedAttachments,
    };
  }

  public reorderKanbanTasks(
    updates: Array<{
      id: string;
      columnId?: string;
      status?: Task["status"];
      position: number;
    }>,
  ): Task[] {
    const now = new Date().toISOString();
    for (const update of updates) {
      const task = this.state.tasks.find((t) => t.id === update.id);
      if (task) {
        if (update.columnId !== undefined) task.columnId = update.columnId;
        if (update.status !== undefined) task.status = update.status;
        task.position = update.position;
        task.updatedAt = now;
      }
    }
    this.save();
    return this.state.tasks;
  }

  public deleteTask(id: string): boolean {
    this.state.tasks = this.state.tasks.filter((t) => t.id !== id);
    this.state.subtasks = this.state.subtasks.filter((st) => st.taskId !== id);
    this.state.attachments = this.state.attachments.filter(
      (att) => att.taskId !== id,
    );
    this.save();
    return true;
  }

  // --- Kanban Columns ---
  public getKanbanColumns(): KanbanColumn[] {
    if (!this.state.kanbanColumns || this.state.kanbanColumns.length === 0) {
      this.state.kanbanColumns = [...DEFAULT_KANBAN_COLUMNS];
      this.save();
    }
    return this.state.kanbanColumns;
  }

  public saveKanbanColumns(columns: KanbanColumn[]): KanbanColumn[] {
    const hasTodo = columns.some((c) => c.baseStatus === "todo");
    const hasInProgress = columns.some((c) => c.baseStatus === "in_progress");
    const hasDone = columns.some((c) => c.baseStatus === "done");

    if (!hasTodo || !hasInProgress || !hasDone) {
      throw new Error(
        "Chaque statut de base (À faire, En cours, Terminé) doit avoir au moins une colonne active.",
      );
    }

    this.state.kanbanColumns = columns;
    this.save();
    return columns;
  }

  public deleteKanbanColumn(id: string): boolean {
    const colToDelete = (this.state.kanbanColumns || []).find(
      (c) => c.id === id,
    );
    if (!colToDelete) return false;

    const remainingOfStatus = (this.state.kanbanColumns || []).filter(
      (c) => c.baseStatus === colToDelete.baseStatus && c.id !== id,
    );
    if (remainingOfStatus.length === 0) {
      throw new Error(
        `Impossible de supprimer la dernière colonne pour le statut "${colToDelete.baseStatus}".`,
      );
    }

    const fallbackCol = remainingOfStatus[0];
    this.state.tasks = this.state.tasks.map((t) =>
      t.columnId === id ? { ...t, columnId: fallbackCol.id } : t,
    );

    this.state.kanbanColumns = this.state.kanbanColumns.filter(
      (c) => c.id !== id,
    );
    this.save();
    return true;
  }

  // --- Subtasks ---
  public getSubtasks(taskId: string): Subtask[] {
    return this.state.subtasks.filter((st) => st.taskId === taskId);
  }

  public saveSubtasks(taskId: string, subtasks: Subtask[]): Subtask[] {
    this.state.subtasks = this.state.subtasks
      .filter((st) => st.taskId !== taskId)
      .concat(subtasks);
    this.save();
    return subtasks;
  }

  // --- Attachments (Zéro copie) ---
  public getAttachments(taskId: string): TaskAttachment[] {
    const list = this.state.attachments.filter((att) => att.taskId === taskId);
    return list.map((att) => ({
      ...att,
      isMissing: !fs.existsSync(att.filePath),
    }));
  }

  public addAttachment(attachment: TaskAttachment): TaskAttachment {
    // Vérification de sécurité absolue : on vérifie que le fichier existe et on stocke uniquement le chemin absolu
    const exists = fs.existsSync(attachment.filePath);
    const stat = exists ? fs.statSync(attachment.filePath) : undefined;

    const newAtt: TaskAttachment = {
      ...attachment,
      fileSize: stat ? stat.size : attachment.fileSize,
      isMissing: !exists,
    };

    this.state.attachments.push(newAtt);
    this.save();
    return newAtt;
  }

  public removeAttachment(id: string): boolean {
    this.state.attachments = this.state.attachments.filter(
      (att) => att.id !== id,
    );
    this.save();
    return true;
  }

  public relocateAttachment(id: string, newFilePath: string): boolean {
    const att = this.state.attachments.find((a) => a.id === id);
    if (att) {
      att.filePath = newFilePath;
      att.fileName = path.basename(newFilePath);
      if (fs.existsSync(newFilePath)) {
        att.fileSize = fs.statSync(newFilePath).size;
      }
      this.save();
      return true;
    }
    return false;
  }

  // --- Timetable ---
  public getTimetable(): TimetableSlot[] {
    return this.state.timetableSlots;
  }

  public saveTimetable(slots: TimetableSlot[]): TimetableSlot[] {
    this.state.timetableSlots = slots;
    this.save();
    return slots;
  }

  // --- Grades ---
  public getGrades(): Grade[] {
    return this.state.grades;
  }

  public saveGrade(grade: Grade): Grade {
    const index = this.state.grades.findIndex((g) => g.id === grade.id);
    if (index >= 0) {
      this.state.grades[index] = grade;
    } else {
      this.state.grades.push(grade);
    }
    this.save();
    return grade;
  }

  public deleteGrade(id: string): boolean {
    this.state.grades = this.state.grades.filter((g) => g.id !== id);
    this.save();
    return true;
  }

  // --- Pomodoro ---
  public getPomodoroSessions(): PomodoroSession[] {
    return this.state.pomodoroSessions;
  }

  public logPomodoroSession(session: PomodoroSession): PomodoroSession {
    this.state.pomodoroSessions.push(session);
    this.save();
    return session;
  }

  // --- Notes ---
  public getNotes(subjectId?: string): SubjectNote[] {
    if (subjectId) {
      return this.state.subjectNotes.filter((n) => n.subjectId === subjectId);
    }
    return this.state.subjectNotes;
  }

  public saveNote(note: SubjectNote): SubjectNote {
    const index = this.state.subjectNotes.findIndex((n) => n.id === note.id);
    if (index >= 0) {
      this.state.subjectNotes[index] = {
        ...note,
        updatedAt: new Date().toISOString(),
      };
    } else {
      this.state.subjectNotes.push({
        ...note,
        updatedAt: new Date().toISOString(),
      });
    }
    this.save();
    return note;
  }

  public deleteNote(id: string): boolean {
    this.state.subjectNotes = this.state.subjectNotes.filter(
      (n) => n.id !== id,
    );
    this.save();
    return true;
  }

  // --- Export & Import ---
  public exportData(): string {
    return JSON.stringify(
      {
        format: "planiscol",
        version: this.state.version,
        exportedAt: new Date().toISOString(),
        data: this.state,
      },
      null,
      2,
    );
  }

  public importData(jsonContent: string): boolean {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed.format === "planiscol" && parsed.data) {
        this.createBackupSnapshot(); // Snapshot de sécurité avant écrasement
        this.state = this.runMigrations(parsed.data);
        this.save();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Erreur lors de l’importation des données:", err);
      return false;
    }
  }
}
