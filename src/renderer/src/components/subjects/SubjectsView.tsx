import React, { useState } from "react";
import {
  Plus,
  BookOpen,
  User,
  MapPin,
  Award,
  Folder,
  Trash2,
  Edit2,
  FileText,
} from "lucide-react";
import { useSubjectStore } from "../../stores/useSubjectStore";
import { Subject } from "../../types";

interface SubjectsViewProps {
  onOpenNotes: (subject: Subject) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({ onOpenNotes }) => {
  const { subjects, saveSubject, deleteSubject } = useSubjectStore();
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [icon, setIcon] = useState("📚");
  const [teacher, setTeacher] = useState("");
  const [room, setRoom] = useState("");
  const [coefficient, setCoefficient] = useState<number>(1);
  const [courseFolderPath, setCourseFolderPath] = useState("");

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setName("");
    setCategory("Sciences");
    setColor("#3b82f6");
    setIcon("📚");
    setTeacher("");
    setRoom("");
    setCoefficient(1);
    setCourseFolderPath("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Subject) => {
    setEditingSubject(s);
    setName(s.name);
    setCategory(s.category || "Général");
    setColor(s.color);
    setIcon(s.icon || "📚");
    setTeacher(s.teacher || "");
    setRoom(s.room || "");
    setCoefficient(s.coefficient || 1);
    setCourseFolderPath(s.courseFolderPath || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = new Date().toISOString();
    const subjectData: Subject = {
      id: editingSubject?.id || `sub-${Date.now()}`,
      name: name.trim(),
      category: category.trim() || "Général",
      color,
      icon,
      teacher: teacher.trim() || undefined,
      room: room.trim() || undefined,
      coefficient: coefficient > 0 ? coefficient : 1,
      courseFolderPath: courseFolderPath.trim() || undefined,
      createdAt: editingSubject ? editingSubject.createdAt : now,
      updatedAt: now,
    };

    await saveSubject(subjectData);
    setIsModalOpen(false);
  };

  const handlePickCourseFolder = async () => {
    const picked = await window.api.dialog.pickDirectory({
      title: "Sélectionner le dossier de cours sur votre PC",
    });
    if (picked) {
      setCourseFolderPath(picked);
    }
  };

  const palette = [
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#64748b",
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-4 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">
            Matières & Cours
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gérez vos matières, coefficients, professeurs et dossiers de cours
            locaux.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une matière</span>
        </button>
      </div>

      {/* Grid of Subjects */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-white/5 hover:border-white/15 transition-all group relative overflow-hidden"
            >
              {/* Subtle accent glow in background */}
              <div
                className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
                style={{ backgroundColor: sub.color }}
              />

              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md"
                      style={{
                        backgroundColor: `${sub.color}25`,
                        border: `1px solid ${sub.color}50`,
                      }}
                    >
                      {sub.icon || "📚"}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-white">
                        {sub.name}
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {sub.category || "Général"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteSubject(sub.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  {sub.teacher && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Prof. {sub.teacher}</span>
                    </div>
                  )}

                  {sub.room && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>Salle : {sub.room}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-500" />
                    <span>Coefficient : {sub.coefficient || 1}</span>
                  </div>

                  {sub.courseFolderPath && (
                    <div
                      onClick={() =>
                        window.api.file.openPath(sub.courseFolderPath!)
                      }
                      className="flex items-center gap-2 text-indigo-400 hover:underline cursor-pointer truncate"
                      title={sub.courseFolderPath}
                    >
                      <Folder className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        Ouvrir le dossier de cours
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button: Notes */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => onOpenNotes(sub)}
                  className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover font-semibold transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Bloc-notes du cours</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel-elevated w-full max-w-md rounded-2xl p-6 shadow-2xl border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="font-display text-lg font-bold text-white mb-4">
              {editingSubject ? "Modifier la matière" : "Nouvelle matière"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nom de la matière
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Mathématiques"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex : Sciences"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Emoji / Icône
                  </label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="Ex : 📐"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent text-center text-base"
                  />
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Couleur d'identification
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {palette.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c
                          ? "scale-125 ring-2 ring-white"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Professeur
                  </label>
                  <input
                    type="text"
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                    placeholder="M. Dupont"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Salle
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="B204"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Coefficient
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={coefficient}
                    onChange={(e) =>
                      setCoefficient(parseFloat(e.target.value) || 1)
                    }
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Folder Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dossier de cours local (Optionnel)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={courseFolderPath}
                    readOnly
                    placeholder="Aucun dossier lié"
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 truncate"
                  />
                  <button
                    type="button"
                    onClick={handlePickCourseFolder}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-xs font-medium text-white rounded-xl transition-colors"
                  >
                    Choisir...
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-white/5"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
