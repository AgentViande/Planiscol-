export type TaskType =
  | 'devoir'
  | 'controle'
  | 'projet'
  | 'expose'
  | 'revision'
  | 'lecture'
  | 'autre'

export type PriorityLevel = 'high' | 'medium' | 'low'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Subject {
  id: string
  name: string
  category: string
  color: string
  icon?: string
  teacher?: string
  room?: string
  coefficient?: number
  courseFolderPath?: string
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  subjectId?: string
  type: TaskType
  priority: PriorityLevel
  dueDate?: string // ISO string
  startDate?: string // ISO string
  estimatedDuration?: number // minutes
  status: TaskStatus
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'custom'
    interval?: number
    daysOfWeek?: number[]
    until?: string
  }
  reminderMinutes?: number // ex: 60 for 1h before, 1440 for 1 day before
  tags: string[]
  orderIndex: number
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface Subtask {
  id: string
  taskId: string
  title: string
  completed: boolean
  orderIndex: number
}

export interface TaskAttachment {
  id: string
  taskId: string
  filePath: string // STRICT: Chemin absolu uniquement, pas de copie !
  fileName: string
  fileSize?: number
  fileType?: string
  addedAt: string
  isMissing?: boolean // Calculé dynamiquement à la volée
}

export interface TimetableSlot {
  id: string
  subjectId: string
  dayOfWeek: number // 1 = Lundi, ..., 7 = Dimanche
  startTime: string // "08:00"
  endTime: string // "09:30"
  room?: string
  teacher?: string
  weekType: 'all' | 'A' | 'B'
}

export interface Grade {
  id: string
  subjectId: string
  value: number // ex: 16.5
  outOf: number // ex: 20
  coefficient: number // ex: 2
  title: string
  date: string // YYYY-MM-DD
  period: string // "Trimestre 1", "Semestre 1", etc.
}

export interface PomodoroSession {
  id: string
  taskId?: string
  durationMinutes: number
  completedAt: string
}

export interface SubjectNote {
  id: string
  subjectId: string
  title: string
  content: string
  updatedAt: string
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system'
  accentColor: string
  schoolLevel: 'college' | 'lycee' | 'superieur' | 'custom'
  autoUpdate: boolean
  closeToTray: boolean
  launchAtStartup: boolean
  reminderNotifications: boolean
  onboardingCompleted: boolean
  pomodoroWorkDuration: number
  pomodoroBreakDuration: number
}

export interface PlaniscolDatabaseState {
  version: number
  subjects: Subject[]
  tasks: Task[]
  subtasks: Subtask[]
  attachments: TaskAttachment[]
  timetableSlots: TimetableSlot[]
  grades: Grade[]
  pomodoroSessions: PomodoroSession[]
  subjectNotes: SubjectNote[]
  settings: UserSettings
}
