import React, { useEffect, useState } from "react";
import { Sparkles, ArrowRight, X, Download } from "lucide-react";

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string | Array<{ note: string }>;
}

export const UpdateNotificationBanner: React.FC = () => {
  const [downloadedInfo, setDownloadedInfo] = useState<UpdateInfo | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (window.api?.on?.updaterStatus) {
      const unsub = window.api.on.updaterStatus((data) => {
        if (data.status === "update-downloaded" && data.payload) {
          const info = data.payload as UpdateInfo;
          setDownloadedInfo(info);
          setIsDismissed(false);
        }
      });
      return () => unsub();
    }
  }, []);

  if (!downloadedInfo || isDismissed) return null;

  const handleInstall = (): void => {
    if (window.api?.updater?.install) {
      window.api.updater.install();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full bg-slate-900/95 border border-accent/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Mise à jour v{downloadedInfo.version} prête !</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Le nouveau package a été téléchargé avec succès en arrière-plan.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={() => setIsDismissed(true)}
          className="px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:bg-white/5 transition-colors font-medium"
        >
          Plus tard
        </button>
        <button
          onClick={handleInstall}
          className="px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-glow flex items-center gap-1.5 transition-all"
        >
          <span>Redémarrer pour installer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
