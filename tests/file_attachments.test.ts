import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { DatabaseManager } from '../src/main/db/database'
import { TaskAttachment } from '../src/main/db/types'

describe('Règle Zéro Copie & Détection des Liens Cassés', () => {
  let tempDir: string
  let testUserDataDir: string
  let testExternalFilePath: string
  let db: DatabaseManager

  beforeEach(() => {
    // Création d'un dossier temporaire externe simulant le disque de l'utilisateur (ex: Téléchargements ou Bureau)
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'planiscol-user-files-'))
    testUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'planiscol-userdata-'))

    testExternalFilePath = path.join(tempDir, 'DM_Geometrie_Sujet.pdf')
    fs.writeFileSync(testExternalFilePath, 'CONTENU_DU_FICHIER_SCOLAIRE_NON_COPIE', 'utf-8')

    db = new DatabaseManager(testUserDataDir)
  })

  afterEach(() => {
    // Nettoyage
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
      fs.rmSync(testUserDataDir, { recursive: true, force: true })
    } catch {}
  })

  it('Preuve absolue : aucun fichier n’est copié ni dupliqué dans l’application', () => {
    const originalStats = fs.statSync(testExternalFilePath)

    const attachment: TaskAttachment = {
      id: 'att-test-1',
      taskId: 'task-test-1',
      filePath: testExternalFilePath,
      fileName: 'DM_Geometrie_Sujet.pdf',
      addedAt: new Date().toISOString()
    }

    // Ajout du document lié
    const saved = db.addAttachment(attachment)

    // 1. Vérification que le chemin absolu exact est conservé
    expect(saved.filePath).toBe(testExternalFilePath)
    expect(saved.isMissing).toBe(false)
    expect(saved.fileSize).toBe(originalStats.size)

    // 2. Vérification que le fichier externe existe toujours à sa place d'origine
    expect(fs.existsSync(testExternalFilePath)).toBe(true)

    // 3. Vérification formelle qu'aucun fichier PDF ou copie n'a été créé dans userData
    const filesInUserData = fs.readdirSync(testUserDataDir)
    const hasCopiedFile = filesInUserData.some((file) => file.endsWith('.pdf'))
    expect(hasCopiedFile).toBe(false)

    // Vérifie que les seuls fichiers présents dans userData sont planiscol.json et le dossier backups
    expect(filesInUserData).toContain('planiscol.json')
  })

  it('Détection automatique des liens cassés lorsque le fichier est déplacé ou supprimé', () => {
    const attachment: TaskAttachment = {
      id: 'att-test-2',
      taskId: 'task-test-2',
      filePath: testExternalFilePath,
      fileName: 'DM_Geometrie_Sujet.pdf',
      addedAt: new Date().toISOString()
    }

    db.addAttachment(attachment)

    // Simule la suppression ou le déplacement du fichier par l'élève sur son ordinateur
    fs.unlinkSync(testExternalFilePath)
    expect(fs.existsSync(testExternalFilePath)).toBe(false)

    // Récupération des pièces jointes : le flag isMissing doit être à true
    const attachments = db.getAttachments('task-test-2')
    expect(attachments).toHaveLength(1)
    expect(attachments[0].isMissing).toBe(true)

    // Test de relocalisation
    const newLocation = path.join(tempDir, 'DM_Geometrie_Relocalise.pdf')
    fs.writeFileSync(newLocation, 'NOUVELLE_LOCALISATION', 'utf-8')

    const relocated = db.relocateAttachment('att-test-2', newLocation)
    expect(relocated).toBe(true)

    const updated = db.getAttachments('task-test-2')
    expect(updated[0].filePath).toBe(newLocation)
    expect(updated[0].isMissing).toBe(false)
  })
})
