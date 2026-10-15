import React, { useState } from "react";
import { Sparkles, BookOpen, GraduationCap, School } from "lucide-react";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { useSubjectStore } from "../../stores/useSubjectStore";

export const OnboardingModal: React.FC = () => {
  const { settings, setSchoolLevel } = useSettingsStore();
  const { loadSubjects } = useSubjectStore();
  const [selectedLevel, setSelectedLevel] = useState<
    "college" | "lycee" | "superieur"
  >("lycee");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (settings.onboardingCompleted) return null;

  const levels = [
    {
      id: "college",
      title: "Collège",
      description:
        "De la 6ème à la 3ème. Matières fondamentales et préparation au brevet.",
      icon: School,
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
    },
    {
      id: "lycee",
      title: "Lycée",
      description:
        "Seconde, Première et Terminale. Spécialités, tronc commun et baccalauréat.",
      icon: BookOpen,
      color: "from-indigo-500/20 to-violet-500/20",
      borderColor: "border-indigo-500/40",
    },
    {
      id: "superieur",
      title: "Études Supérieures & Université",
      description:
        "Université, Prépa, BTS, BUT, Grandes Écoles. Projets et coefficients modulaires.",
      icon: GraduationCap,
      color: "from-amber-500/20 to-emerald-500/20",
      borderColor: "border-amber-500/30",
    },
  ];

  const handleFinish = async (): Promise<void> => {
    setIsSubmitting(true);
    await setSchoolLevel(selectedLevel);
    await loadSubjects();
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel-elevated w-full max-w-xl rounded-3xl p-8 shadow-2xl border-indigo-500/30 text-center space-y-6 animate-in zoom-in-95 duration-200">
        {/* Logo and Greeting */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-glow">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white">
            Bienvenue sur Planiscol
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 max-w-md mx-auto">
            Votre agenda scolaire moderne, ultra-rapide et 100% local. Pour bien
            démarrer, choisissez votre niveau d'études :
          </p>
        </div>

        {/* Level Cards */}
        <div className="space-y-3 text-left">
          {levels.map((lvl) => {
            const Icon = lvl.icon;
            const isSelected = selectedLevel === lvl.id;
            return (
              <div
                key={lvl.id}
                onClick={() =>
                  setSelectedLevel(lvl.id as "college" | "lycee" | "superieur")
                }
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                  isSelected
                    ? `bg-gradient-to-r ${lvl.color} ${lvl.borderColor} ring-1 ring-accent shadow-glow`
                    : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "bg-accent text-white"
                      : "bg-white/10 text-slate-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white">
                    {lvl.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lvl.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleFinish}
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-glow transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting
            ? "Configuration en cours..."
            : "Commencer l’année scolaire"}
        </button>
      </div>
    </div>
  );
};
