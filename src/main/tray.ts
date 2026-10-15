import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron'
import * as path from 'path'

let tray: Tray | null = null

export function setupTray(getMainWindow: () => BrowserWindow | null): Tray | null {
  const iconPath = path.join(__dirname, '../../resources/icon.png')
  let icon = nativeImage.createFromPath(iconPath)
  if (icon.isEmpty()) {
    icon = nativeImage.createEmpty()
  } else {
    icon = icon.resize({ width: 16, height: 16 })
  }

  try {
    tray = new Tray(icon)
  } catch (err) {
    console.warn('Impossible de créer l’icône système de la barre des tâches:', err)
    return null
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Ouvrir Planiscol',
      click: (): void => {
        const win = getMainWindow()
        if (win) {
          if (win.isMinimized()) win.restore()
          win.show()
          win.focus()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Nouvelle tâche rapide (Ctrl+Space)',
      click: (): void => {
        const win = getMainWindow()
        if (win) {
          win.show()
          win.focus()
          win.webContents.send('shortcut:quick-add')
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quitter',
      click: (): void => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('Planiscol — Agenda Scolaire')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    const win = getMainWindow()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  })

  return tray
}
