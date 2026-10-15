import { ipcMain, shell, dialog, BrowserWindow, Notification } from 'electron'
import { DatabaseManager } from '../db/database'
import * as fs from 'fs'
import * as path from 'path'
import { Subject, Task, Subtask, TaskAttachment, TimetableSlot, Grade, PomodoroSession, SubjectNote, UserSettings } from '../db/types'

export function registerIpcHandlers(db: DatabaseManager, getMainWindow: () => BrowserWindow | null): void {
  // --- Données et État Global ---
  ipcMain.handle('db:getState', () => db.getState())
  ipcMain.handle('db:getSettings', () => db.getSettings())
  ipcMain.handle('db:updateSettings', (_, updates: Partial<UserSettings>) => db.updateSettings(updates))
  ipcMain.handle('db:setSchoolLevel', (_, level: 'college' | 'lycee' | 'superieur') => db.setSchoolLevel(level))

  // --- Matières ---
  ipcMain.handle('db:getSubjects', () => db.getSubjects())
  ipcMain.handle('db:saveSubject', (_, subject: Subject) => db.saveSubject(subject))
  ipcMain.handle('db:deleteSubject', (_, id: string) => db.deleteSubject(id))

  // --- Tâches ---
  ipcMain.handle('db:getTasks', () => db.getTasks())
  ipcMain.handle('db:saveTask', (_, task: Task) => db.saveTask(task))
  ipcMain.handle('db:deleteTask', (_, id: string) => db.deleteTask(id))

  // --- Sous-tâches ---
  ipcMain.handle('db:getSubtasks', (_, taskId: string) => db.getSubtasks(taskId))
  ipcMain.handle('db:saveSubtasks', (_, taskId: string, subtasks: Subtask[]) => db.saveSubtasks(taskId, subtasks))

  // --- Fichiers Liés (ZÉRO COPIE) ---
  ipcMain.handle('db:getAttachments', (_, taskId: string) => db.getAttachments(taskId))
  ipcMain.handle('db:addAttachment', (_, attachment: TaskAttachment) => db.addAttachment(attachment))
  ipcMain.handle('db:removeAttachment', (_, id: string) => db.removeAttachment(id))
  ipcMain.handle('db:relocateAttachment', (_, id: string, newPath: string) => db.relocateAttachment(id, newPath))

  // --- Emploi du Temps ---
  ipcMain.handle('db:getTimetable', () => db.getTimetable())
  ipcMain.handle('db:saveTimetable', (_, slots: TimetableSlot[]) => db.saveTimetable(slots))

  // --- Notes et Moyennes ---
  ipcMain.handle('db:getGrades', () => db.getGrades())
  ipcMain.handle('db:saveGrade', (_, grade: Grade) => db.saveGrade(grade))
  ipcMain.handle('db:deleteGrade', (_, id: string) => db.deleteGrade(id))

  // --- Pomodoro ---
  ipcMain.handle('db:getPomodoroSessions', () => db.getPomodoroSessions())
  ipcMain.handle('db:logPomodoroSession', (_, session: PomodoroSession) => db.logPomodoroSession(session))

  // --- Bloc-notes Matière ---
  ipcMain.handle('db:getNotes', (_, subjectId?: string) => db.getNotes(subjectId))
  ipcMain.handle('db:saveNote', (_, note: SubjectNote) => db.saveNote(note))
  ipcMain.handle('db:deleteNote', (_, id: string) => db.deleteNote(id))

  // --- Sauvegarde, Export & Import ---
  ipcMain.handle('db:exportData', () => db.exportData())
  ipcMain.handle('db:importData', (_, jsonContent: string) => db.importData(jsonContent))
  ipcMain.handle('db:createBackup', () => db.createBackupSnapshot())

  // --- Opérations Système Sécurisées (Shell / Dialogs) ---
  ipcMain.handle('file:openPath', async (_, targetPath: string) => {
    if (!targetPath) return 'Chemin vide'
    return await shell.openPath(targetPath)
  })

  ipcMain.handle('file:showItemInFolder', (_, targetPath: string) => {
    if (!targetPath) return
    shell.showItemInFolder(targetPath)
  })

  ipcMain.handle('file:checkExists', (_, targetPath: string) => {
    if (!targetPath) return false
    return fs.existsSync(targetPath)
  })

  ipcMain.handle('dialog:pickFiles', async (_, options?: { title?: string; defaultPath?: string }) => {
    const win = getMainWindow()
    const res = await dialog.showOpenDialog(win || undefined, {
      title: options?.title || 'Sélectionner des documents à lier',
      defaultPath: options?.defaultPath,
      properties: ['openFile', 'multiSelections']
    })

    if (res.canceled || res.filePaths.length === 0) return []

    return res.filePaths.map((fp) => {
      const stats = fs.existsSync(fp) ? fs.statSync(fp) : undefined
      const ext = path.extname(fp).toLowerCase().replace('.', '')
      return {
        filePath: fp, // Chemin absolu uniquement
        fileName: path.basename(fp),
        fileSize: stats?.size,
        fileType: ext
      }
    })
  })

  ipcMain.handle('dialog:pickDirectory', async (_, options?: { title?: string; defaultPath?: string }) => {
    const win = getMainWindow()
    const res = await dialog.showOpenDialog(win || undefined, {
      title: options?.title || 'Sélectionner un dossier de cours',
      defaultPath: options?.defaultPath,
      properties: ['openDirectory']
    })

    if (res.canceled || res.filePaths.length === 0) return null
    return res.filePaths[0]
  })

  // --- Contrôles de Fenêtre (Custom TitleBar) ---
  ipcMain.on('window:minimize', () => {
    const win = getMainWindow()
    win?.minimize()
  })

  ipcMain.on('window:maximize', () => {
    const win = getMainWindow()
    if (!win) return
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  ipcMain.on('window:close', () => {
    const win = getMainWindow()
    win?.close()
  })

  ipcMain.handle('window:isMaximized', () => {
    const win = getMainWindow()
    return win ? win.isMaximized() : false
  })

  // --- Notifications Natives ---
  ipcMain.on('notification:show', (_, payload: { title: string; body: string }) => {
    if (Notification.isSupported()) {
      new Notification({
        title: payload.title,
        body: payload.body,
        silent: false
      }).show()
    }
  })
}
