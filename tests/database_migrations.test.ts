import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { DatabaseManager } from '../src/main/db/database'

describe('Base de données, Migrations & Sauvegardes rotatives', () => {
  let testUserDataDir: string

  beforeEach(() => {
    testUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'planiscol-db-test-'))
  })

  afterEach(() => {
    try {
      fs.rmSync(testUserDataDir, { recursive: true, force: true })
    } catch {}
  })

  it('Initialise la base avec le schéma V1 et les matières par défaut', () => {
    const db = new DatabaseManager(testUserDataDir)
    const state = db.getState()

    expect(state.version).toBe(1)
    expect(state.subjects.length).toBeGreaterThan(0)
    expect(state.tasks).toEqual([])
    expect(fs.existsSync(path.join(testUserDataDir, 'planiscol.json'))).toBe(true)
  })

  it('Génère et fait tourner les sauvegardes rotatives automatiques (max 10)', () => {
    const db = new DatabaseManager(testUserDataDir)
    const backupDir = path.join(testUserDataDir, 'backups')

    // Génère 12 snapshots successifs
    for (let i = 0; i < 12; i++) {
      db.createBackupSnapshot()
    }

    const backupFiles = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith('planiscol_backup_') && f.endsWith('.json'))

    // Ne doit pas dépasser 10 sauvegardes
    expect(backupFiles.length).toBeLessThanOrEqual(10)
  })

  it('Exporte et réimporte les données avec intégrité (.planiscol)', () => {
    const db = new DatabaseManager(testUserDataDir)
    db.saveTask({
      id: 'task-export-1',
      title: 'Devoir de SVT',
      type: 'devoir',
      priority: 'high',
      status: 'todo',
      tags: ['bio'],
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    const exported = db.exportData()
    expect(exported).toContain('Devoir de SVT')
    expect(exported).toContain('planiscol')

    // Réinitialise une autre base et importe
    const newDir = fs.mkdtempSync(path.join(os.tmpdir(), 'planiscol-import-test-'))
    const newDb = new DatabaseManager(newDir)
    const imported = newDb.importData(exported)

    expect(imported).toBe(true)
    expect(newDb.getTasks().some((t) => t.title === 'Devoir de SVT')).toBe(true)

    fs.rmSync(newDir, { recursive: true, force: true })
  })
})
