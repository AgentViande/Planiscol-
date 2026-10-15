import { autoUpdater } from "electron-updater";
import { BrowserWindow, ipcMain } from "electron";

export function setupAutoUpdater(
  getMainWindow: () => BrowserWindow | null,
): void {
  // Config autoUpdater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  function sendStatusToWindow(status: string, payload?: unknown): void {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send("updater:status", { status, payload });
    }
  }

  autoUpdater.on("checking-for-update", () => {
    sendStatusToWindow("checking-for-update");
  });

  autoUpdater.on("update-available", (info) => {
    sendStatusToWindow("update-available", info);
  });

  autoUpdater.on("update-not-available", (info) => {
    sendStatusToWindow("update-not-available", info);
  });

  autoUpdater.on("error", (err) => {
    sendStatusToWindow(
      "error",
      err == null ? "unknown" : (err.stack || err).toString(),
    );
  });

  autoUpdater.on("download-progress", (progressObj) => {
    sendStatusToWindow("download-progress", progressObj);
  });

  autoUpdater.on("update-downloaded", (info) => {
    sendStatusToWindow("update-downloaded", info);
  });

  ipcMain.handle("updater:check", async () => {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (err: unknown) {
      console.warn("Erreur vérification mise à jour:", err);
      return null;
    }
  });

  ipcMain.on("updater:install", () => {
    autoUpdater.quitAndInstall();
  });
}
