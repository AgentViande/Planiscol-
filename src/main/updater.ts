import { autoUpdater, UpdateInfo } from "electron-updater";
import { BrowserWindow, ipcMain, app, shell } from "electron";
import log from "electron-log";

// Configuration de electron-log
log.transports.file.level = "info";
log.transports.file.fileName = "planiscol-updater.log";
autoUpdater.logger = log;

export interface UpdaterStatusPayload {
  status:
    | "idle"
    | "checking-for-update"
    | "update-available"
    | "update-not-available"
    | "download-progress"
    | "update-downloaded"
    | "dev-mode"
    | "error";
  info?: UpdateInfo | null;
  error?: string | null;
  progress?: {
    percent: number;
    bytesPerSecond: number;
    transferred: number;
    total: number;
  } | null;
  checkedAt?: string;
}

let lastStatusPayload: UpdaterStatusPayload = {
  status: "idle",
  checkedAt: undefined,
};

export function setupAutoUpdater(
  getMainWindow: () => BrowserWindow | null,
): void {
  // Configuration autoUpdater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  log.info("Initialisation du module de mise à jour Planiscol...");
  log.info(`Version courante: v${app.getVersion()}, isPackaged: ${app.isPackaged}`);

  function sendStatusToWindow(data: UpdaterStatusPayload): void {
    lastStatusPayload = {
      ...data,
      checkedAt: data.checkedAt || new Date().toISOString(),
    };
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send("updater:status", lastStatusPayload);
    }
  }

  autoUpdater.on("checking-for-update", () => {
    log.info("Vérification des mises à jour sur GitHub Releases...");
    sendStatusToWindow({ status: "checking-for-update" });
  });

  autoUpdater.on("update-available", (info: UpdateInfo) => {
    log.info(`Mise à jour disponible: v${info.version} (publiée le ${info.releaseDate})`);
    sendStatusToWindow({
      status: "update-available",
      info,
    });
  });

  autoUpdater.on("update-not-available", (info: UpdateInfo) => {
    log.info(`Application à jour. Dernière version disponible: v${info.version}`);
    sendStatusToWindow({
      status: "update-not-available",
      info,
    });
  });

  autoUpdater.on("error", (err: Error) => {
    const errorMsg = err == null ? "Erreur inconnue" : (err.stack || err.message || err.toString());
    log.error("Erreur lors de la mise à jour:", errorMsg);
    sendStatusToWindow({
      status: "error",
      error: errorMsg,
    });
  });

  autoUpdater.on("download-progress", (progressObj) => {
    log.info(`Téléchargement: ${Math.round(progressObj.percent)}% (${progressObj.bytesPerSecond} o/s)`);
    sendStatusToWindow({
      status: "download-progress",
      progress: {
        percent: progressObj.percent,
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total,
      },
    });
  });

  autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
    log.info(`Mise à jour v${info.version} téléchargée et prête à être installée.`);
    sendStatusToWindow({
      status: "update-downloaded",
      info,
    });
  });

  async function checkForUpdates(): Promise<UpdaterStatusPayload> {
    if (!app.isPackaged) {
      log.info("Mode développement détecté : vérification simulée/désactivée.");
      const devPayload: UpdaterStatusPayload = {
        status: "dev-mode",
        error: "Mode développement : les mises à jour automatiques sont actives uniquement sur l'application installée.",
        checkedAt: new Date().toISOString(),
      };
      sendStatusToWindow(devPayload);
      return devPayload;
    }

    try {
      sendStatusToWindow({ status: "checking-for-update" });
      const checkResult = await autoUpdater.checkForUpdates();
      log.info("Résultat checkForUpdates:", checkResult?.updateInfo?.version || "aucun");
      return lastStatusPayload;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log.error("Échec de checkForUpdates:", errorMsg);
      const errorPayload: UpdaterStatusPayload = {
        status: "error",
        error: errorMsg,
        checkedAt: new Date().toISOString(),
      };
      sendStatusToWindow(errorPayload);
      return errorPayload;
    }
  }

  // IPC Handlers
  ipcMain.handle("updater:check", async () => {
    return await checkForUpdates();
  });

  ipcMain.handle("updater:getLastStatus", () => {
    return lastStatusPayload;
  });

  ipcMain.on("updater:install", () => {
    log.info("Demande d'installation de la mise à jour (quitAndInstall)...");
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.handle("updater:openLog", async () => {
    try {
      const logFilePath = log.transports.file.getFile().path;
      log.info("Ouverture du fichier journal:", logFilePath);
      return await shell.openPath(logFilePath);
    } catch (err) {
      log.error("Impossible d'ouvrir le fichier journal:", err);
      return "Erreur d'ouverture du journal";
    }
  });

  // Déclenchement automatique au démarrage (après un délai de 5s pour laisser l'interface s'afficher)
  if (app.isPackaged) {
    setTimeout(() => {
      log.info("Lancement de la vérification initiale au démarrage...");
      checkForUpdates().catch((err) => {
        log.warn("Erreur check initial:", err);
      });
    }, 5000);

    // Vérification périodique toutes les 4 heures
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    setInterval(() => {
      log.info("Lancement de la vérification périodique...");
      checkForUpdates().catch((err) => {
        log.warn("Erreur check périodique:", err);
      });
    }, FOUR_HOURS);
  }
}
