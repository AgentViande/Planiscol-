import { PriorityLevel, TaskType, Subject } from "../types";

export interface ParsedTaskInput {
  title: string;
  subjectId?: string;
  priority: PriorityLevel;
  type: TaskType;
  dueDate?: string; // ISO
  estimatedDuration?: number; // minutes
  tags: string[];
}

export function parseNaturalLanguageTask(
  input: string,
  subjects: Subject[],
): ParsedTaskInput {
  let remaining = input.trim();
  const tags: string[] = [];
  let priority: PriorityLevel = "medium";
  let type: TaskType = "devoir";
  let subjectId: string | undefined = undefined;
  let estimatedDuration: number | undefined = undefined;
  let dueDate: Date | undefined = undefined;

  // 1. Extraction des tags (#urgent, #dm, etc.)
  const tagMatches = remaining.match(/#[a-zA-Z0-9_\u00C0-\u017F]+/g);
  if (tagMatches) {
    tagMatches.forEach((t) => tags.push(t.replace("#", "")));
    remaining = remaining.replace(/#[a-zA-Z0-9_\u00C0-\u017F]+/g, " ");
  }

  // 2. Détection de la priorité
  if (
    /\b(priorit[eé]\s*haute|urgent|urgente|haute|important|🔴)\b/i.test(
      remaining,
    )
  ) {
    priority = "high";
    remaining = remaining.replace(
      /\b(priorit[eé]\s*haute|urgent|urgente|haute|important|🔴)\b/gi,
      " ",
    );
  } else if (
    /\b(priorit[eé]\s*basse|basse|faible|secondaire|🟢)\b/i.test(remaining)
  ) {
    priority = "low";
    remaining = remaining.replace(
      /\b(priorit[eé]\s*basse|basse|faible|secondaire|🟢)\b/gi,
      " ",
    );
  } else if (
    /\b(priorit[eé]\s*moyenne|moyenne|normale|🟠)\b/i.test(remaining)
  ) {
    priority = "medium";
    remaining = remaining.replace(
      /\b(priorit[eé]\s*moyenne|moyenne|normale|🟠)\b/gi,
      " ",
    );
  }

  // 3. Détection du type de tâche
  if (/\b(contr[oô]le|examen|partiel|ds|évaluation)\b/i.test(remaining)) {
    type = "controle";
    // On conserve le mot si l'utilisateur n'a mis que ça, sinon on note le type
  } else if (/\b(projet|dossier)\b/i.test(remaining)) {
    type = "projet";
  } else if (/\b(expos[eé]|pr[eé]sentation|oral)\b/i.test(remaining)) {
    type = "expose";
  } else if (/\b(r[eé]vision|r[eé]viser)\b/i.test(remaining)) {
    type = "revision";
  } else if (/\b(lecture|lire)\b/i.test(remaining)) {
    type = "lecture";
  } else if (/\b(devoir|dm|exercice|exo)\b/i.test(remaining)) {
    type = "devoir";
  }

  // 4. Détection de la matière
  for (const sub of subjects) {
    const subNameClean = sub.name.toLowerCase();
    const regex = new RegExp(`\\b${escapeRegExp(subNameClean)}\\b`, "i");
    if (regex.test(remaining)) {
      subjectId = sub.id;
      remaining = remaining.replace(regex, " ");
      break;
    }
    if (subNameClean.includes("math") && /\bmaths?\b/i.test(remaining)) {
      subjectId = sub.id;
      remaining = remaining.replace(/\bmaths?\b/gi, " ");
      break;
    }
    if (subNameClean.includes("physique") && /\bphysique\b/i.test(remaining)) {
      subjectId = sub.id;
      remaining = remaining.replace(/\bphysique\b/gi, " ");
      break;
    }
    if (
      subNameClean.includes("histoire") &&
      /\bhistoire(-g[eé]o)?\b/i.test(remaining)
    ) {
      subjectId = sub.id;
      remaining = remaining.replace(/\bhistoire(-g[eé]o)?\b/gi, " ");
      break;
    }
    if (subNameClean.includes("fran") && /\bfran[cç]ais\b/i.test(remaining)) {
      subjectId = sub.id;
      remaining = remaining.replace(/\bfran[cç]ais\b/gi, " ");
      break;
    }
  }

  // 5. Détection de la durée estimée (avec préfixe explicite durée/pendant ou unités min)
  const explicitDurationMatch = remaining.match(
    /\b(?:dur[eé]e|pendant)\s*(\d+)\s*(h|min|m|heures?)((\d+)\s*(min|m)?)?\b/i,
  );
  if (explicitDurationMatch) {
    const firstVal = parseInt(explicitDurationMatch[1], 10);
    const unit = explicitDurationMatch[2].toLowerCase();
    if (unit.startsWith("h")) {
      let mins = firstVal * 60;
      if (explicitDurationMatch[4]) {
        mins += parseInt(explicitDurationMatch[4], 10);
      }
      estimatedDuration = mins;
    } else {
      estimatedDuration = firstVal;
    }
    remaining = remaining.replace(explicitDurationMatch[0], " ");
  } else {
    // Détection de minutes simples (ex: 30min ou 45m)
    const minMatch = remaining.match(/\b(\d+)\s*(min|minutes)\b/i);
    if (minMatch) {
      estimatedDuration = parseInt(minMatch[1], 10);
      remaining = remaining.replace(minMatch[0], " ");
    }
  }

  // 6. Détection de date et heure
  const now = new Date();
  let targetDate = new Date(now);
  let foundDate = false;

  // Jours relatifs
  if (/\b(aujourd'?hui|ce soir)\b/i.test(remaining)) {
    foundDate = true;
    remaining = remaining.replace(/\b(aujourd'?hui|ce soir)\b/gi, " ");
  } else if (/\bdemain\b/i.test(remaining)) {
    foundDate = true;
    targetDate.setDate(targetDate.getDate() + 1);
    remaining = remaining.replace(/\bdemain\b/gi, " ");
  } else if (/\bapr[eè]s-?demain\b/i.test(remaining)) {
    foundDate = true;
    targetDate.setDate(targetDate.getDate() + 2);
    remaining = remaining.replace(/\bapr[eè]s-?demain\b/gi, " ");
  } else {
    // Jours de la semaine : lundi, mardi, etc.
    const daysMap: Record<string, number> = {
      dimanche: 0,
      lundi: 1,
      mardi: 2,
      mercredi: 3,
      jeudi: 4,
      vendredi: 5,
      samedi: 6,
    };
    for (const [dayName, dayIndex] of Object.entries(daysMap)) {
      const dayRegex = new RegExp(`\\b${dayName}(\\s+prochain)?\\b`, "i");
      if (dayRegex.test(remaining)) {
        foundDate = true;
        const currentDay = targetDate.getDay();
        let diff = dayIndex - currentDay;
        if (diff <= 0) diff += 7;
        targetDate.setDate(targetDate.getDate() + diff);
        remaining = remaining.replace(dayRegex, " ");
        break;
      }
    }
  }

  // Détection de l'heure (ex: 18h, 18h30, 18:00)
  const timeMatch = remaining.match(/\b([01]?\d|2[0-3])[h:]([0-5]\d)?\b/i);
  if (timeMatch) {
    foundDate = true;
    const hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    targetDate.setHours(hours, minutes, 0, 0);
    remaining = remaining.replace(timeMatch[0], " ");
  } else if (foundDate) {
    // Heure par défaut pour les échéances : 18:00
    targetDate.setHours(18, 0, 0, 0);
  }

  if (foundDate) {
    dueDate = targetDate;
  }

  // Nettoyage final du titre
  const cleanTitle = remaining
    .replace(/\s+/g, " ")
    .replace(/^[-–—:,;.\s]+|[-–—:,;.\s]+$/g, "")
    .trim();

  return {
    title: cleanTitle || input.trim(),
    subjectId,
    priority,
    type,
    dueDate: dueDate ? dueDate.toISOString() : undefined,
    estimatedDuration,
    tags,
  };
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
