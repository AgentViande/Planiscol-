import React, { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  RefreshCw,
  Bell,
  Minimize2,
  HardDrive,
  FileText,
  Maximize,
  Volume2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useSettingsStore } from "../../stores/useSettingsStore";

interface UpdaterInfoPayload {
  version: string;
  releaseDate?: string;
  releaseNotes?: string | Array<{ note: string }>;
}

interface UpdaterStatusData {
  status:
    | "idle"
    | "checking-for-update"
    | "update-available"
    | "update-not-available"
    | "download-progress"
    | "update-downloaded"
    | "dev-mode"
    | "error";
  info?: UpdaterInfoPayload | null;
  error?: string | null;
  progress?: {
    percent: number;
    bytesPerSecond: number;
    transferred: number;
    total: number;
  } | null;
  checkedAt?: string;
}

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const [appVersion, setAppVersion] = useState<string>("1.1.0");
  const [updaterData, setUpdaterData] = useState<UpdaterStatusData>({
    status: "idle",
  });
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);

  const colors = [
    { name: "Indigo Vibrant", hex: "#6366f1" },
    { name: "Violet Royal", hex: "#8b5cf6" },
    { name: "Émeraude Frais", hex: "#10b981" },
    { name: "Ambre Énergique", hex: "#f59e0b" },
    { name: "Cyan Futuriste", hex: "#06b6d4" },
    { name: "Rose Néon", hex: "#ec4899" },
  ];

  // Chargement de la version et initialisation de l'écouteur updater
  useEffect(() => {
    if (window.api?.app?.getVersion) {
      window.api.app.getVersion().then((v) => {
        if (v) setAppVersion(v);
      });
    }

    if (window.api?.updater?.getLastStatus) {
      window.api.updater.getLastStatus().then((status) => {
        if (status && typeof status === "object") {
          const s = status as UpdaterStatusData;
          setUpdaterData(s);
          if (s.checkedAt) setLastCheckTime(s.checkedAt);
        }
      });
    }

    if (window.api?.on?.updaterStatus) {
      const unsub = window.api.on.updaterStatus((data) => {
        const s = data as unknown as UpdaterStatusData;
        setUpdaterData(s);
        if (s.checkedAt) setLastCheckTime(s.checkedAt);
        if (s.status !== "checking-for-update") {
          setIsCheckingUpdate(false);
        }
      });
      return () => unsub();
    }
  }, []);

  const handleExportData = async (): Promise<void> => {
    if (window.api) {
      const dataStr = await window.api.db.exportData();
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sauvegarde_planiscol_${new Date().toISOString().split("T")[0]}.planiscol`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content && window.api) {
        const ok = await window.api.db.importData(content);
        if (ok) {
          window.location.reload();
        } else {
          alert("Fichier de sauvegarde invalide ou corrompu.");
        }
      }
    };
    reader.readAsText(file);
  };

  const handleCheckUpdate = async (): Promise<void> => {
    setIsCheckingUpdate(true);
    setUpdaterData({ status: "checking-for-update" });
    if (window.api?.updater) {
      try {
        const result = (await window.api.updater.check()) as UpdaterStatusData;
        if (result) {
          setUpdaterData(result);
          if (result.checkedAt) setLastCheckTime(result.checkedAt);
        }
      } catch (err: unknown) {
        setUpdaterData({
          status: "error",
          error: err instanceof Error ? err.message : String(err),
          checkedAt: new Date().toISOString(),
        });
      } finally {
        setIsCheckingUpdate(false);
      }
    } else {
      setTimeout(() => {
        setIsCheckingUpdate(false);
        setUpdaterData({
          status: "update-not-available",
          info: { version: appVersion },
          checkedAt: new Date().toISOString(),
        });
      }, 800);
    }
  };

  const handleOpenLog = async (): Promise<void> => {
    if (window.api?.updater?.openLog) {
      await window.api.updater.openLog();
    }
  };

  const handleInstallNow = (): void => {
    if (window.api?.updater?.install) {
      window.api.updater.install();
    }
  };

  const renderStatusBadge = () => {
    switch (updaterData.status) {
      case "checking-for-update":
        return (
          <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Recherche des mises à jour sur GitHub...</span>
          </div>
        );
      case "update-available":
        return (
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Mise à jour v{updaterData.info?.version} disponible ! Téléchargement en cours...
            </span>
          </div>
        );
      case "download-progress":
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
              <span>Téléchargement de la mise à jour...</span>
              <span>{Math.round(updaterData.progress?.percent || 0)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${updaterData.progress?.percent || 0}%` }}
              />
            </div>
          </div>
        );
      case "update-downloaded":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Mise à jour v{updaterData.info?.version} prête à être installée !
              </span>
            </div>
            <button
              onClick={handleInstallNow}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-glow transition-all"
            >
              Redémarrer pour installer maintenant
            </button>
          </div>
        );
      case "dev-mode":
        return (
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Mode développement actif (mises à jour testables sur l'application installée).</span>
          </div>
        );
      case "error":
        return (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-red-400 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Échec de la recherche de mise à jour</span>
            </div>
            <p className="text-[11px] text-red-300/80 bg-red-500/10 p-2 rounded-lg border border-red-500/20 font-mono break-all">
              {updaterData.error || "Impossible de contacter GitHub Releases."}
            </p>
          </div>
        );
      case "update-not-available":
        return (
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>À jour (v{appVersion}) — Vous disposez de la dernière version.</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-slate-300 text-xs">
            <span>Version installée : <strong className="text-white font-mono">v{appVersion}</strong></span>
          </div>
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 select-none max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">
          Paramètres
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Personnalisation visuelle, mode concentration, système et gestion des sauvegardes locales.
        </p>
      </div>

      {/* 1. Apparence & Thème */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
          <span>Apparence & Ambiance Visuelle</span>
        </h2>

        {/* Theme mode selection */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => updateSettings({ theme: "dark" })}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
              settings.theme === "dark"
                ? "bg-accent/20 border-accent text-white shadow-glow"
                : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Sombre</span>
          </button>

          <button
            onClick={() => updateSettings({ theme: "light" })}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
              settings.theme === "light"
                ? "bg-accent/20 border-accent text-white shadow-glow"
                : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Clair</span>
          </button>

          <button
            onClick={() => updateSettings({ theme: "system" })}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
              settings.theme === "system"
                ? "bg-accent/20 border-accent text-white shadow-glow"
                : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Système</span>
          </button>
        </div>

        {/* Accent Color Palette */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Couleur d'accentuation
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {colors.map((c) => (
              <button
                key={c.hex}
                onClick={() => updateSettings({ accentColor: c.hex })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  settings.accentColor === c.hex
                    ? "border-white text-white scale-105 shadow-glow"
                    : "border-white/5 text-slate-400 hover:border-white/20"
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: c.hex }}
                />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Mode Concentration / Focus Pomodoro */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Mode Concentration & Minuteur Pomodoro</span>
        </h2>

        <div className="space-y-3">
          {/* Vrai plein écran système */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <Maximize className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Vrai plein écran système lors de la concentration
                </p>
                <p className="text-[11px] text-slate-400">
                  Masque la barre des tâches de Windows pour une immersion totale.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.fullScreenFocus ?? false}
              onChange={(e) =>
                updateSettings({ fullScreenFocus: e.target.checked })
              }
              className="rounded border-slate-600 text-accent focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Effets sonores discrets */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Son discret au changement de phase
                </p>
                <p className="text-[11px] text-slate-400">
                  Émet un carillon doux lors du passage en pause ou en concentration.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.pomodoroSoundEnabled ?? true}
              onChange={(e) =>
                updateSettings({ pomodoroSoundEnabled: e.target.checked })
              }
              className="rounded border-slate-600 text-accent focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Durées personnalisables */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-white/5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Concentration (min)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={settings.pomodoroWorkDuration || 25}
                onChange={(e) =>
                  updateSettings({
                    pomodoroWorkDuration: Math.max(1, parseInt(e.target.value) || 25),
                  })
                }
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div className="p-3 rounded-xl bg-white/5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Pause courte (min)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={settings.pomodoroBreakDuration || 5}
                onChange={(e) =>
                  updateSettings({
                    pomodoroBreakDuration: Math.max(1, parseInt(e.target.value) || 5),
                  })
                }
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div className="p-3 rounded-xl bg-white/5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Pause longue (min)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={settings.pomodoroLongBreakDuration || 15}
                onChange={(e) =>
                  updateSettings({
                    pomodoroLongBreakDuration: Math.max(
                      1,
                      parseInt(e.target.value) || 15,
                    ),
                  })
                }
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Comportement du Système */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
          <span>Comportement & Notifications</span>
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <Minimize2 className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Réduire dans la zone de notification (Tray)
                </p>
                <p className="text-[11px] text-slate-400">
                  La fenêtre reste disponible en arrière-plan à la fermeture.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.closeToTray}
              onChange={(e) =>
                updateSettings({ closeToTray: e.target.checked })
              }
              className="rounded border-slate-600 text-accent focus:ring-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Rappels et notifications système
                </p>
                <p className="text-[11px] text-slate-400">
                  Recevoir des notifications Windows avant les échéances de devoirs.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.reminderNotifications}
              onChange={(e) =>
                updateSettings({ reminderNotifications: e.target.checked })
              }
              className="rounded border-slate-600 text-accent focus:ring-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. Sauvegarde 100% Locale & Export / Import */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span>Données & Sauvegardes Locales (100% Hors-Ligne)</span>
        </h2>

        <p className="text-xs text-slate-400 leading-relaxed">
          Toutes vos tâches, notes et configurations sont stockées exclusivement
          sur votre PC. Aucun compte, aucun serveur, zéro télémétrie.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all border border-white/10"
          >
            <Download className="w-4 h-4" />
            <span>Exporter mes données (.planiscol)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all border border-white/10 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Importer une sauvegarde</span>
            <input
              type="file"
              accept=".planiscol,.json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 5. Mises à Jour Automatiques via GitHub */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 border-accent/20">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-accent" />
            <span>Mises à Jour Logicielles (GitHub Releases)</span>
          </h2>
          <span className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            v{appVersion}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Planiscol intègre un système de mise à jour sécurisé connecté au dépôt public{" "}
          <strong className="text-slate-200">AgentViande/Planiscol-</strong>.
        </p>

        {/* Panneau de statut visuel */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
          {renderStatusBadge()}

          {lastCheckTime && (
            <p className="text-[11px] text-slate-400">
              Dernière vérification : {new Date(lastCheckTime).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleCheckUpdate}
            disabled={isCheckingUpdate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? "animate-spin" : ""}`} />
            <span>{isCheckingUpdate ? "Recherche en cours..." : "Rechercher une mise à jour"}</span>
          </button>

          <button
            onClick={handleOpenLog}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium transition-colors border border-white/5"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Ouvrir le journal de mise à jour</span>
          </button>
        </div>
      </div>
    </div>
  );
};
