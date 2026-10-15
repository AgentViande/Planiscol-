import React, { useState, useEffect } from "react";
import { X, Save, FileText } from "lucide-react";
import { Subject, SubjectNote } from "../../types";

interface SubjectNotesModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SubjectNotesModal: React.FC<SubjectNotesModalProps> = ({
  subject,
  isOpen,
  onClose,
}) => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (subject && isOpen) {
      if (window.api) {
        window.api.db.getNotes(subject.id).then((notes) => {
          if (notes.length > 0) {
            setNoteId(notes[0].id);
            setTitle(notes[0].title);
            setContent(notes[0].content);
          } else {
            setNoteId(null);
            setTitle(`Notes de cours — ${subject.name}`);
            setContent(
              `# ${subject.name}\n\n- Chapitre 1 : \n- Formules importantes : \n`,
            );
          }
        });
      }
    }
  }, [subject, isOpen]);

  if (!isOpen || !subject) return null;

  const handleSave = async (): Promise<void> => {
    if (!window.api) return;
    const noteData: SubjectNote = {
      id: noteId || `note-${Date.now()}`,
      subjectId: subject.id,
      title: title || `Notes de cours — ${subject.name}`,
      content,
      updatedAt: new Date().toISOString(),
    };
    await window.api.db.saveNote(noteData);
    setNoteId(noteData.id);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel-elevated w-full max-w-3xl h-[80vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border-white/10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ backgroundColor: `${subject.color}25` }}
            >
              {subject.icon || "📝"}
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <span>{subject.name}</span>
                <span className="text-xs text-slate-400 font-normal">
                  Bloc-notes Markdown
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaved ? "Enregistré !" : "Enregistrer"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Note Body */}
        <div className="flex-1 p-6 flex flex-col space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la fiche..."
            className="w-full bg-transparent border-b border-white/10 pb-2 text-base font-bold text-white focus:outline-none focus:border-accent"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écrivez vos notes de cours ici en markdown..."
            className="flex-1 w-full bg-slate-900/60 border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};
