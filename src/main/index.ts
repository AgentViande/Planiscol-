import { app, shell, BrowserWindow, globalShortcut } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { DatabaseManager } from "./db/database";
import { registerIpcHandlers } from "./ipc/handlers";
import { setupTray } from "./tray";
import { setupAutoUpdater } from "./updater";

let mainWindow: BrowserWindow | null = null;
let db: DatabaseManager | null = null;

function createWindow(): BrowserWindow {
  db = new DatabaseManager();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false, // Custom Titlebar
    titleBarStyle: "hidden",
    backgroundColor: "#090d16",
    autoHideMenuBar: true,
    icon: join(__dirname, "../../resources/icon.png"),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // Enregistrement des IPC handlers
  registerIpcHandlers(db, () => mainWindow);

  // Enregistrement du Tray
  setupTray(() => mainWindow);

  // Configuration auto-updater
  setupAutoUpdater(() => mainWindow);

  // Gestion de la fermeture / Tray
  mainWindow.on("close", (event) => {
    const settings = db?.getSettings();
    if (settings?.closeToTray && !app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Chargement de l'URL ou du fichier bundle
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return mainWindow;
}

// Propriété pour gérer la fermeture définitive
declare global {
  namespace NodeJS {
    interface Process {
      isQuitting?: boolean;
    }
  }
}
(app as unknown as { isQuitting: boolean }).isQuitting = false;

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.planiscol.app");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  // Raccourci global Quick Add (Ctrl+Space ou Ctrl+Shift+A)
  try {
    globalShortcut.register("CommandOrControl+Shift+A", () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send("shortcut:quick-add");
      }
    });
  } catch (err) {
    console.warn("Impossible d’enregistrer le raccourci global:", err);
  }

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on("before-quit", () => {
  (app as unknown as { isQuitting: boolean }).isQuitting = true;
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
