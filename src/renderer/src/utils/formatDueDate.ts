/**
 * Formate une date d'échéance de manière compacte et lisible en français :
 * - « En retard » (si dépassée et non terminée)
 * - « Aujourd'hui 18h » ou « Aujourd'hui »
 * - « Demain 18h » ou « Demain »
 * - « Ven. 18h » si dans les 7 jours
 * - « 14 nov. » au-delà
 */
export function formatDueDateFriendly(dueDateStr?: string): {
  text: string;
  isOverdue: boolean;
} {
  if (!dueDateStr) return { text: "", isOverdue: false };

  const due = new Date(dueDateStr);
  if (isNaN(due.getTime())) return { text: "", isOverdue: false };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateOnly = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate(),
  );

  const diffTime = dueDateOnly.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  // A-t-on une heure spécifiée autre que 00:00 ?
  const hasTime = due.getHours() !== 0 || due.getMinutes() !== 0;
  const timeStr = hasTime
    ? ` ${due.getHours()}h${due.getMinutes() > 0 ? String(due.getMinutes()).padStart(2, "0") : ""}`
    : "";

  if (diffDays < 0) {
    return {
      text: `En retard${timeStr ? ` (${timeStr.trim()})` : ""}`,
      isOverdue: true,
    };
  }

  if (diffDays === 0) {
    return { text: `Aujourd'hui${timeStr}`, isOverdue: false };
  }

  if (diffDays === 1) {
    return { text: `Demain${timeStr}`, isOverdue: false };
  }

  if (diffDays > 1 && diffDays < 7) {
    const dayName = due.toLocaleDateString("fr-FR", { weekday: "short" });
    const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    return { text: `${capitalized}${timeStr}`, isOverdue: false };
  }

  const formattedDate = due.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  return { text: `${formattedDate}${timeStr}`, isOverdue: false };
}
