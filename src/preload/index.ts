import { contextBridge, ipcRenderer } from "electron";
import {
  Subject,
  Task,
  Subtask,
  TaskAttachment,
  TimetableSlot,
  Grade,
  PomodoroSession,
  SubjectNote,
  UserSettings,
  PlaniscolDatabaseState,
  KanbanColumn,
} from "../main/db/types";

export const api = {
  db: {
    getState: (): Promise<PlaniscolDatabaseState> =>
      ipcRenderer.invoke("db:getState"),
    getSettings: (): Promise<UserSettings> =>
      ipcRenderer.invoke("db:getSettings"),
    updateSettings: (updates: Partial<UserSettings>): Promise<UserSettings> =>
      ipcRenderer.invoke("db:updateSettings", updates),
    setSchoolLevel: (level: "college" | "lycee" | "superieur"): Promise<void> =>
      ipcRenderer.invoke("db:setSchoolLevel", level),

    getSubjects: (): Promise<Subject[]> => ipcRenderer.invoke("db:getSubjects"),
    saveSubject: (subject: Subject): Promise<Subject> =>
      ipcRenderer.invoke("db:saveSubject", subject),
    deleteSubject: (id: string): Promise<boolean> =>
      ipcRenderer.invoke("db:deleteSubject", id),

    getTasks: (): Promise<Task[]> => ipcRenderer.invoke("db:getTasks"),
    saveTask: (task: Task): Promise<Task> =>
      ipcRenderer.invoke("db:saveTask", task),
    saveTaskWithDetails: (
      task: Task,
      subtasks: Subtask[],
      attachments: TaskAttachment[],
    ): Promise<{ task: Task; subtasks: Subtask[]; attachments: TaskAttachment[] }> =>
      ipcRenderer.invoke("db:saveTaskWithDetails", task, subtasks, attachments),
    deleteTask: (id: string): Promise<boolean> =>
      ipcRenderer.invoke("db:deleteTask", id),
    reorderKanbanTasks: (
      updates: Array<{
        id: string;
        columnId?: string;
        status?: Task["status"];
        position: number;
      }>,
    ): Promise<Task[]> => ipcRenderer.invoke("db:reorderKanbanTasks", updates),
    getKanbanColumns: (): Promise<KanbanColumn[]> =>
      ipcRenderer.invoke("db:getKanbanColumns"),
    saveKanbanColumns: (columns: KanbanColumn[]): Promise<KanbanColumn[]> =>
      ipcRenderer.invoke("db:saveKanbanColumns", columns),
    deleteKanbanColumn: (id: string): Promise<boolean> =>
      ipcRenderer.invoke("db:deleteKanbanColumn", id),

    getSubtasks: (taskId: string): Promise<Subtask[]> =>
      ipcRenderer.invoke("db:getSubtasks", taskId),
    saveSubtasks: (taskId: string, subtasks: Subtask[]): Promise<Subtask[]> =>
      ipcRenderer.invoke("db:saveSubtasks", taskId, subtasks),

    getAttachments: (taskId: string): Promise<TaskAttachment[]> =>
      ipcRenderer.invoke("db:getAttachments", taskId),
    addAttachment: (attachment: TaskAttachment): Promise<TaskAttachment> =>
      ipcRenderer.invoke("db:addAttachment", attachment),
    removeAttachment: (id: string): Promise<boolean> =>
      ipcRenderer.invoke("db:removeAttachment", id),
    relocateAttachment: (id: string, newPath: string): Promise<boolean> =>
      ipcRenderer.invoke("db:relocateAttachment", id, newPath),

    getTimetable: (): Promise<TimetableSlot[]> =>
      ipcRenderer.invoke("db:getTimetable"),
    saveTimetable: (slots: TimetableSlot[]): Promise<TimetableSlot[]> =>
      ipcRenderer.invoke("db:saveTimetable", slots),

    getGrades: (): Promise<Grade[]> => ipcRenderer.invoke("db:getGrades"),
    saveGrade: (grade: Grade): Promise<Grade> =>
      ipcRenderer.invoke("db:saveGrade", grade),
    deleteGrade: (id: string): Promise<boolean> =>
      ipcRenderer.invoke("db:deleteGrade", id),

    getPomodoroSessions: (): Promise<PomodoroSession[]> =>
      ipcRenderer.invoke("db:getPomodoroSessions"),
    logPomodoroSession: (session: PomodoroSession): Promise<PomodoroSession> =>
      ipcRenderer.invoke("db:logPomodoroSession", session),

    getNotes: (subjectId?: string): Promise<SubjectNote[]> =>
      ipcRenderer.invoke("db:getNotes", subjectId),
    saveNote: (note: SubjectNote): Promise<SubjectNote> =>
      ipcRenderer.invoke("db:saveNote", note),
    deleteNote: (id: string): Promise<boolean> =>
      ipcRenderer.invoke("db:deleteNote", id),

    exportData: (): Promise<string> => ipcRenderer.invoke("db:exportData"),
    importData: (json: string): Promise<boolean> =>
      ipcRenderer.invoke("db:importData", json),
    createBackup: (): Promise<string> => ipcRenderer.invoke("db:createBackup"),
  },
  file: {
    openPath: (targetPath: string): Promise<string> =>
      ipcRenderer.invoke("file:openPath", targetPath),
    showItemInFolder: (targetPath: string): Promise<void> =>
      ipcRenderer.invoke("file:showItemInFolder", targetPath),
    checkExists: (targetPath: string): Promise<boolean> =>
      ipcRenderer.invoke("file:checkExists", targetPath),
  },
  dialog: {
    pickFiles: (options?: {
      title?: string;
      defaultPath?: string;
    }): Promise<
      Array<{
        filePath: string;
        fileName: string;
        fileSize?: number;
        fileType?: string;
      }>
    > => ipcRenderer.invoke("dialog:pickFiles", options),
    pickDirectory: (options?: {
      title?: string;
      defaultPath?: string;
    }): Promise<string | null> =>
      ipcRenderer.invoke("dialog:pickDirectory", options),
  },
  window: {
    minimize: (): void => ipcRenderer.send("window:minimize"),
    maximize: (): void => ipcRenderer.send("window:maximize"),
    close: (): void => ipcRenderer.send("window:close"),
    isMaximized: (): Promise<boolean> =>
      ipcRenderer.invoke("window:isMaximized"),
    setFullScreen: (flag: boolean): Promise<boolean> =>
      ipcRenderer.invoke("window:setFullScreen", flag),
    isFullScreen: (): Promise<boolean> =>
      ipcRenderer.invoke("window:isFullScreen"),
  },
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke("app:getVersion"),
  },
  notification: {
    show: (payload: { title: string; body: string }): void =>
      ipcRenderer.send("notification:show", payload),
  },
  updater: {
    check: (): Promise<unknown> => ipcRenderer.invoke("updater:check"),
    getLastStatus: (): Promise<unknown> =>
      ipcRenderer.invoke("updater:getLastStatus"),
    openLog: (): Promise<string> => ipcRenderer.invoke("updater:openLog"),
    install: (): void => ipcRenderer.send("updater:install"),
  },
  on: {
    quickAdd: (callback: () => void): (() => void) => {
      const listener = (): void => callback();
      ipcRenderer.on("shortcut:quick-add", listener);
      return () => ipcRenderer.removeListener("shortcut:quick-add", listener);
    },
    updaterStatus: (
      callback: (data: { status: string; payload?: unknown }) => void,
    ): (() => void) => {
      const listener = (
        _: unknown,
        data: { status: string; payload?: unknown },
      ): void => callback(data);
      ipcRenderer.on("updater:status", listener);
      return () => ipcRenderer.removeListener("updater:status", listener);
    },
  },
};

try {
  contextBridge.exposeInMainWorld("api", api);
} catch (error) {
  console.error("Failed to expose api in preload:", error);
}

export type ElectronAPI = typeof api;
