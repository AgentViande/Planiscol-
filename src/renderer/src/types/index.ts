export type TaskType =
  | "devoir"
  | "controle"
  | "projet"
  | "expose"
  | "revision"
  | "lecture"
  | "autre";

export type PriorityLevel = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Subject {
  id: string;
  name: string;
  category: string;
  color: string;
  icon?: string;
  teacher?: string;
  room?: string;
  coefficient?: number;
  courseFolderPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  type: TaskType;
  priority: PriorityLevel;
  dueDate?: string; // ISO string
  startDate?: string; // ISO string
  estimatedDuration?: number; // minutes
  status: TaskStatus;
  recurrence?: {
    frequency: "daily" | "weekly" | "custom";
    interval?: number;
    daysOfWeek?: number[];
    until?: string;
  };
  reminderMinutes?: number;
  tags: string[];
  orderIndex: number;
  position: number;
  columnId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  orderIndex: number;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  filePath: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  addedAt: string;
  isMissing?: boolean;
}

export interface TimetableSlot {
  id: string;
  subjectId: string;
  dayOfWeek: number; // 1..7 (Lundi..Dimanche)
  startTime: string; // "08:00"
  endTime: string; // "10:00"
  room?: string;
  teacher?: string;
  weekType: "all" | "A" | "B";
}

export interface Grade {
  id: string;
  subjectId: string;
  value: number;
  outOf: number;
  coefficient: number;
  title: string;
  date: string;
  period: string;
}

export interface PomodoroSession {
  id: string;
  taskId?: string;
  durationMinutes: number;
  completedAt: string;
}

export interface SubjectNote {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  baseStatus: TaskStatus; // 'todo' | 'in_progress' | 'done'
  orderIndex: number;
  color?: string;
}

export interface UserSettings {
  theme: "dark" | "light" | "system";
  accentColor: string;
  schoolLevel: "college" | "lycee" | "superieur" | "custom";
  autoUpdate: boolean;
  closeToTray: boolean;
  launchAtStartup: boolean;
  reminderNotifications: boolean;
  onboardingCompleted: boolean;
  pomodoroWorkDuration: number;
  pomodoroBreakDuration: number;
  lastActiveTab?: string;
  kanbanGroupBy?: "none" | "subject" | "priority";
  kanbanHideCompletedOld?: boolean;
  kanbanSortBy?: "position" | "dueDate" | "priority";
}
