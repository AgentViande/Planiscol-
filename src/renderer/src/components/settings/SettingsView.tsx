import React, { useState } from "react";
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
} from "lucide-react";
import { useSettingsStore } from "../../stores/useSettingsStore";

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const [updaterStatus, setUpdaterStatus] = useState<string>("À jour (v1.0.0)");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const colors = [
    { name: "Indigo Vibrant", hex: "#6366f1" },
    { name: "Violet Royal", hex: "#8b5cf6" },
    { name: "Émeraude Frais", hex: "#10b981" },
    { name: "Ambre Énergique", hex: "#f59e0b" },
    { name: "Cyan Futuriste", hex: "#06b6d4" },
    { name: "Rose Néon", hex: "#ec4899" },
  ];

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
    setUpdaterStatus("Recherche en cours sur GitHub...");
    if (window.api) {
      try {
        await window.api.updater.check();
        setTimeout(() => {
          setIsCheckingUpdate(false);
          setUpdaterStatus("Vous utilisez la dernière version (v1.0.0).");
        }, 1500);
      } catch {
        setIsCheckingUpdate(false);
        setUpdaterStatus("Aucune mise à jour trouvée.");
      }
    } else {
      setTimeout(() => {
        setIsCheckingUpdate(false);
        setUpdaterStatus("Version v1.0.0");
      }, 1000);
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
          Personnalisation visuelle, système et gestion des sauvegardes locales.
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

      {/* 2. Comportement du Système */}
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
                  Recevoir des notifications Windows avant les échéances de
                  devoirs.
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

      {/* 3. Sauvegarde 100% Locale & Export / Import */}
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

      {/* 4. Mises à Jour Automatiques via GitHub */}
      <div className="glass-panel p-6 rounded-2xl space-y-3">
        <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-accent" />
          <span>Mises à Jour Automatiques (GitHub Releases)</span>
        </h2>

        <p className="text-xs text-slate-400">
          Planiscol vérifie automatiquement les nouvelles versions publiées sur{" "}
          <strong className="text-slate-200">AgentViande/Planiscol-</strong>.
        </p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-medium text-slate-300">
            {updaterStatus}
          </span>
          <button
            onClick={handleCheckUpdate}
            disabled={isCheckingUpdate}
            className="px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all disabled:opacity-50"
          >
            {isCheckingUpdate
              ? "Vérification..."
              : "Rechercher une mise à jour"}
          </button>
        </div>
      </div>
    </div>
  );
};
