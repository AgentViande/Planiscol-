import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Tag,
  Paperclip,
  CheckSquare,
  AlertTriangle,
  FolderOpen,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  Repeat,
  Bell,
  UploadCloud,
  Flame,
} from "lucide-react";
import { useTaskStore } from "../../stores/useTaskStore";
import { useSubjectStore } from "../../stores/useSubjectStore";
import { usePomodoroStore } from "../../stores/usePomodoroStore";
import {
  Task,
  TaskType,
  PriorityLevel,
  TaskStatus,
  Subtask,
  TaskAttachment,
} from "../../types";

interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  isOpen,
  onClose,
}) => {
  const {
    tasks,
    saveTaskWithDetails,
    deleteTask,
    subtasks: storeSubtasks,
    attachments: storeAttachments,
    loadSubtasks,
    loadAttachments,
  } = useTaskStore();
  const { subjects } = useSubjectStore();

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [type, setType] = useState<TaskType>("devoir");
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [dueDate, setDueDate] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState<number>(30);
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [reminderMinutes, setReminderMinutes] = useState<number>(0);
  const [recurrenceFreq, setRecurrenceFreq] = useState<
    "none" | "daily" | "weekly" | "custom"
  >("none");

  // Local Draft States for Subtasks & Attachments (Atomic Transaction)
  const [draftSubtasks, setDraftSubtasks] = useState<Subtask[]>([]);
  const [draftAttachments, setDraftAttachments] = useState<TaskAttachment[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [isDraggingOverFiles, setIsDraggingOverFiles] = useState(false);

  const task = tasks.find((t) => t.id === taskId);

  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Edit mode: populate existing values
        setTitle(task.title);
        setDescription(task.description || "");
        setSubjectId(task.subjectId || "");
        setType(task.type);
        setPriority(task.priority);
        setDueDate(task.dueDate ? task.dueDate.substring(0, 16) : "");
        setEstimatedDuration(task.estimatedDuration || 30);
        setStatus(task.status);
        setTags(task.tags || []);
        setReminderMinutes(task.reminderMinutes || 0);
        setRecurrenceFreq(task.recurrence?.frequency || "none");

        // Load existing subtasks & attachments
        const existingSubs = storeSubtasks[task.id] || [];
        setDraftSubtasks([...existingSubs]);
        loadSubtasks(task.id).then((subs) => {
          if (subs && subs.length > 0) setDraftSubtasks([...subs]);
        });

        const existingAtts = storeAttachments[task.id] || [];
        setDraftAttachments([...existingAtts]);
        loadAttachments(task.id).then((atts) => {
          if (atts && atts.length > 0) setDraftAttachments([...atts]);
        });
      } else {
        // Creation mode: clean slate
        setTitle("");
        setDescription("");
        setSubjectId(subjects[0]?.id || "");
        setType("devoir");
        setPriority("medium");
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);
        setDueDate(tomorrow.toISOString().substring(0, 16));
        setEstimatedDuration(30);
        setStatus("todo");
        setTags([]);
        setReminderMinutes(0);
        setRecurrenceFreq("none");
        setDraftSubtasks([]);
        setDraftAttachments([]);
      }
      setNewSubtaskTitle("");
      setEditingSubtaskId(null);
    }
  }, [task, isOpen, subjects]);

  if (!isOpen) return null;

  // --- Subtasks Local Handlers ---
  const handleAddSubtask = (e?: React.FormEvent): void => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub: Subtask = {
      id: `draft-st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      taskId: taskId || "",
      title: newSubtaskTitle.trim(),
      completed: false,
      orderIndex: draftSubtasks.length,
    };
    setDraftSubtasks([...draftSubtasks, newSub]);
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (id: string): void => {
    setDraftSubtasks(
      draftSubtasks.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st,
      ),
    );
  };

  const handleDeleteSubtask = (id: string): void => {
    setDraftSubtasks(draftSubtasks.filter((st) => st.id !== id));
  };

  const handleStartRenameSubtask = (st: Subtask): void => {
    setEditingSubtaskId(st.id);
    setEditingSubtaskTitle(st.title);
  };

  const handleSaveRenameSubtask = (id: string): void => {
    if (!editingSubtaskTitle.trim()) return;
    setDraftSubtasks(
      draftSubtasks.map((st) =>
        st.id === id ? { ...st, title: editingSubtaskTitle.trim() } : st,
      ),
    );
    setEditingSubtaskId(null);
    setEditingSubtaskTitle("");
  };

  const handleMoveSubtask = (index: number, direction: -1 | 1): void => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= draftSubtasks.length) return;
    const reordered = [...draftSubtasks];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setDraftSubtasks(
      reordered.map((st, idx) => ({ ...st, orderIndex: idx })),
    );
  };

  // Planificateur de révisions intelligente (disponible en création ET édition)
  const handleGenerateRevisionPlan = (): void => {
    const revisionSteps = [
      "J-14 : Découverte et relecture active du cours",
      "J-7 : Fiches de synthèse et mémorisation des formules",
      "J-3 : Entraînement sur exercices types et annales",
      "J-1 : Relecture finale et préparation des affaires",
    ];
    const newItems: Subtask[] = revisionSteps.map((step, idx) => ({
      id: `draft-rev-${Date.now()}-${idx}`,
      taskId: taskId || "",
      title: step,
      completed: false,
      orderIndex: draftSubtasks.length + idx,
    }));
    setDraftSubtasks([...draftSubtasks, ...newItems]);
  };

  // --- Attachments Local Handlers (ZÉRO COPIE) ---
  const handlePickFiles = async (): Promise<void> => {
    if (!window.api?.dialog) return;
    const picked = await window.api.dialog.pickFiles({
      title: "Sélectionner des documents de cours ou devoirs (sans copie)",
    });
    if (picked && picked.length > 0) {
      const newAtts: TaskAttachment[] = picked.map((file, idx) => ({
        id: `draft-att-${Date.now()}-${idx}`,
        taskId: taskId || "",
        filePath: file.filePath,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        addedAt: new Date().toISOString(),
        isMissing: false,
      }));
      setDraftAttachments([...draftAttachments, ...newAtts]);
    }
  };

  const handleFilesDrop = (files: FileList | null): void => {
    if (!files || files.length === 0) return;
    const droppedAtts: TaskAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as File & { path?: string };
      const rawPath = file.path || file.name;
      const ext = file.name.includes(".")
        ? file.name.split(".").pop()?.toLowerCase()
        : "fichier";
      droppedAtts.push({
        id: `draft-att-${Date.now()}-${i}`,
        taskId: taskId || "",
        filePath: rawPath,
        fileName: file.name,
        fileType: ext,
        fileSize: file.size,
        addedAt: new Date().toISOString(),
        isMissing: false,
      });
    }
    setDraftAttachments([...draftAttachments, ...droppedAtts]);
  };

  const handleRemoveAttachment = (id: string): void => {
    setDraftAttachments(draftAttachments.filter((att) => att.id !== id));
  };

  const handleRelocate = async (attachmentId: string): Promise<void> => {
    if (!window.api?.dialog) return;
    const picked = await window.api.dialog.pickFiles({
      title: "Relocaliser le fichier manquant",
    });
    if (picked && picked.length > 0) {
      const newPath = picked[0].filePath;
      setDraftAttachments(
        draftAttachments.map((att) =>
          att.id === attachmentId
            ? {
                ...att,
                filePath: newPath,
                fileName: picked[0].fileName,
                fileSize: picked[0].fileSize,
                fileType: picked[0].fileType,
                isMissing: false,
              }
            : att,
        ),
      );
    }
  };

  // --- Tags Handlers ---
  const handleAddTag = (): void => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string): void => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // --- Sauvegarde Atomique Finale ---
  const handleSave = async (): Promise<void> => {
    if (!title.trim()) return;

    const finalTaskId =
      taskId || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newTask: Task = {
      id: finalTaskId,
      title: title.trim(),
      description: description.trim(),
      subjectId: subjectId || undefined,
      type,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      estimatedDuration,
      status,
      reminderMinutes: reminderMinutes > 0 ? reminderMinutes : undefined,
      recurrence:
        recurrenceFreq !== "none"
          ? {
              frequency: recurrenceFreq,
            }
          : undefined,
      tags,
      orderIndex: task ? task.orderIndex : tasks.length,
      position: task ? task.position : tasks.length,
      columnId: task?.columnId,
      actualDuration: task?.actualDuration || 0,
      focusSessionsCount: task?.focusSessionsCount || 0,
      focusNotesDraft: task?.focusNotesDraft || "",
      isArchived: false,
      createdAt: task ? task.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Sauvegarde atomique : tâche + sous-tâches + documents liés
    await saveTaskWithDetails(newTask, draftSubtasks, draftAttachments);
    onClose();
  };

  const handleDelete = async (): Promise<void> => {
    if (taskId) {
      await deleteTask(taskId);
      onClose();
    }
  };

  const completedSubsCount = draftSubtasks.filter((s) => s.completed).length;
  const progressPercent =
    draftSubtasks.length > 0
      ? Math.round((completedSubsCount / draftSubtasks.length) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel-elevated w-full max-w-2xl max-h-[92vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border-white/10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-accent">
              {taskId ? "Modifier la tâche" : "Nouvelle tâche"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {taskId && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  usePomodoroStore.getState().openFocusMode(taskId);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all shadow-glow"
                title="Lancer une session de concentration sur cette tâche"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Se concentrer</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 pr-4">
          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Titre de la tâche <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : DM de Géométrie dans l'espace"
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>

          {/* Matière, Type, Priorité */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Matière
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="">(Aucune matière)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent capitalize"
              >
                <option value="devoir">Devoir / Exercices</option>
                <option value="controle">Contrôle / Examen</option>
                <option value="projet">Projet / Dossier</option>
                <option value="expose">Exposé / Oral</option>
                <option value="revision">Session de Révision</option>
                <option value="lecture">Lecture</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Priorité
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="high">🔴 Haute (Urgent)</option>
                <option value="medium">🟠 Moyenne</option>
                <option value="low">🟢 Basse</option>
              </select>
            </div>
          </div>

          {/* Échéance, Durée estimée, Statut */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                <span>Date d'échéance</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>Durée estimée</span>
              </label>
              <select
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(parseInt(e.target.value))}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 heure</option>
                <option value={90}>1h 30min</option>
                <option value={120}>2 heures</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminé</option>
              </select>
            </div>
          </div>

          {/* Récurrence & Rappel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-accent" />
                <span>Récurrence</span>
              </label>
              <select
                value={recurrenceFreq}
                onChange={(e) =>
                  setRecurrenceFreq(
                    e.target.value as "none" | "daily" | "weekly" | "custom",
                  )
                }
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="none">Aucune récurrence (unique)</option>
                <option value="daily">Chaque jour</option>
                <option value="weekly">Chaque semaine</option>
                <option value="custom">Personnalisée</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-accent" />
                <span>Rappel avant l'échéance</span>
              </label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(parseInt(e.target.value))}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value={0}>Aucun rappel</option>
                <option value={15}>15 minutes avant</option>
                <option value={30}>30 minutes avant</option>
                <option value={60}>1 heure avant</option>
                <option value={120}>2 heures avant</option>
                <option value={1440}>1 jour avant</option>
                <option value={2880}>2 jours avant</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Consignes & Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes, énoncés, chapitres à réviser..."
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Planificateur de révisions intelligente (disponible en création & édition) */}
          {(type === "controle" || type === "projet") && (
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>Planificateur de révisions espacées</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Générer automatiquement les étapes de révision (J-14, J-7, J-3, J-1)
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateRevisionPlan}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-medium border border-indigo-500/30 transition-colors"
              >
                Générer les étapes
              </button>
            </div>
          )}

          {/* Checklist des Sous-tâches (Création ET Édition en mémoire locale) */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-accent" />
                <span>
                  Sous-tâches ({completedSubsCount}/{draftSubtasks.length})
                </span>
              </label>
              {draftSubtasks.length > 0 && (
                <span className="text-xs font-semibold text-slate-400">
                  {progressPercent}%
                </span>
              )}
            </div>

            {/* Barre de progression */}
            {draftSubtasks.length > 0 && (
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-accent h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Liste ordonnable des sous-tâches */}
            <div className="space-y-1.5">
              {draftSubtasks.map((st, idx) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 group transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleToggleSubtask(st.id)}
                      className="rounded border-slate-600 text-accent focus:ring-0 cursor-pointer"
                    />

                    {editingSubtaskId === st.id ? (
                      <div className="flex items-center gap-1.5 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingSubtaskTitle}
                          onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRenameSubtask(st.id);
                            if (e.key === "Escape") setEditingSubtaskId(null);
                          }}
                          className="bg-slate-900 border border-accent rounded px-2 py-0.5 text-xs text-white flex-1 focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRenameSubtask(st.id)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`text-xs truncate flex-1 ${
                          st.completed
                            ? "line-through text-slate-500"
                            : "text-slate-200"
                        }`}
                      >
                        {st.title}
                      </span>
                    )}
                  </div>

                  {/* Actions de réordonnancement, renommage, suppression */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSubtask(idx, -1)}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                      title="Monter"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === draftSubtasks.length - 1}
                      onClick={() => handleMoveSubtask(idx, 1)}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                      title="Descendre"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartRenameSubtask(st)}
                      className="p-1 text-slate-400 hover:text-accent"
                      title="Renommer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="p-1 text-slate-400 hover:text-red-400"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Ajout d'une sous-tâche */}
            <form onSubmit={handleAddSubtask} className="flex gap-2 mt-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Ajouter une étape..."
                className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
              >
                Ajouter
              </button>
            </form>
          </div>

          {/* Documents Liés (SANS COPIE, Drag & Drop + Sélecteur natif) */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-accent" />
                <span>Documents & Cours liés (Zéro copie)</span>
              </label>
              <button
                type="button"
                onClick={handlePickFiles}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 border border-white/5 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Lier un document...</span>
              </button>
            </div>

            {/* Zone Drag & Drop */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOverFiles(true);
              }}
              onDragLeave={() => setIsDraggingOverFiles(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOverFiles(false);
                handleFilesDrop(e.dataTransfer.files);
              }}
              onClick={handlePickFiles}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDraggingOverFiles
                  ? "border-accent bg-accent/10"
                  : "border-white/10 hover:border-accent/40 bg-white/[0.02]"
              }`}
            >
              <UploadCloud className="w-5 h-5 mx-auto text-slate-400 mb-1" />
              <p className="text-xs text-slate-300">
                Glissez-déposez des fichiers ici ou{" "}
                <span className="text-accent underline">parcourez votre PC</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Seul le chemin d'accès absolu est mémorisé. Zéro copie, zéro déplacement.
              </p>
            </div>

            {/* Liste des documents liés */}
            {draftAttachments.length > 0 && (
              <div className="space-y-2 pt-1">
                {draftAttachments.map((att) => (
                  <div
                    key={att.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      att.isMissing
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-white/5 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-base">
                        {att.fileType?.includes("pdf")
                          ? "📕"
                          : att.fileType?.includes("doc")
                            ? "📘"
                            : att.fileType?.includes("ppt")
                              ? "📙"
                              : att.fileType?.includes("png") ||
                                  att.fileType?.includes("jpg")
                                ? "🖼️"
                                : "📄"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-xs font-medium text-slate-200 truncate"
                          title={att.filePath}
                        >
                          {att.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {att.filePath}
                        </p>
                        {att.isMissing && (
                          <div className="flex items-center gap-1.5 mt-1 text-red-400 text-[11px] font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Fichier déplacé ou introuvable !</span>
                            <button
                              type="button"
                              onClick={() => handleRelocate(att.id)}
                              className="underline hover:text-red-300 ml-1"
                            >
                              Relocaliser...
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!att.isMissing && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              window.api?.file?.openPath(att.filePath)
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Ouvrir le document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              window.api?.file?.showItemInFolder(att.filePath)
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Afficher dans l'explorateur Windows"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                        title="Détacher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-accent" />
              <span>Étiquettes (tags)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium flex items-center gap-1"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Ajouter une étiquette (ex : #urgent)..."
                className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-slate-950/40">
          {taskId ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer la tâche</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
