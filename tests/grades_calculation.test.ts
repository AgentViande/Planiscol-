import { describe, it, expect } from "vitest";
import { Grade, Subject } from "../src/renderer/src/types";

function calculateSubjectAverage(
  grades: Grade[],
  subjectId: string,
): number | null {
  const list = grades.filter((g) => g.subjectId === subjectId);
  if (list.length === 0) return null;

  let totalPoints = 0;
  let totalCoeff = 0;

  for (const g of list) {
    const normalizedValue = (g.value / (g.outOf || 20)) * 20;
    const coeff = g.coefficient > 0 ? g.coefficient : 1;
    totalPoints += normalizedValue * coeff;
    totalCoeff += coeff;
  }

  if (totalCoeff === 0) return null;
  return Math.round((totalPoints / totalCoeff) * 100) / 100;
}

function calculateOverallAverage(
  grades: Grade[],
  subjects: Subject[],
): number | null {
  let totalPoints = 0;
  let totalCoeff = 0;

  for (const s of subjects) {
    const avg = calculateSubjectAverage(grades, s.id);
    if (avg !== null) {
      const coeff = s.coefficient && s.coefficient > 0 ? s.coefficient : 1;
      totalPoints += avg * coeff;
      totalCoeff += coeff;
    }
  }

  if (totalCoeff === 0) return null;
  return Math.round((totalPoints / totalCoeff) * 100) / 100;
}

describe("Calcul des Moyennes et Coefficients Scolaires", () => {
  const subjects: Subject[] = [
    {
      id: "maths",
      name: "Mathématiques",
      category: "Sciences",
      color: "#3b82f6",
      coefficient: 5,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "francais",
      name: "Français",
      category: "Lettres",
      color: "#ef4444",
      coefficient: 3,
      createdAt: "",
      updatedAt: "",
    },
  ];

  it("Calcule la moyenne pondérée d’une matière avec notes sur 20 et sur 10", () => {
    const grades: Grade[] = [
      {
        id: "g1",
        subjectId: "maths",
        title: "DS Géométrie",
        value: 16,
        outOf: 20,
        coefficient: 2,
        date: "2026-10-10",
        period: "Trimestre 1",
      },
      {
        id: "g2",
        subjectId: "maths",
        title: "Interrogation rapide",
        value: 8,
        outOf: 10, // 8/10 -> 16/20
        coefficient: 1,
        date: "2026-10-12",
        period: "Trimestre 1",
      },
    ];

    const avg = calculateSubjectAverage(grades, "maths");
    expect(avg).toBe(16);
  });

  it("Calcule la moyenne générale pondérée selon les coefficients de chaque matière", () => {
    const grades: Grade[] = [
      // Maths: 18/20 (Coeff matière 5)
      {
        id: "g1",
        subjectId: "maths",
        title: "DS 1",
        value: 18,
        outOf: 20,
        coefficient: 1,
        date: "2026-10-10",
        period: "Trimestre 1",
      },
      // Français: 10/20 (Coeff matière 3)
      {
        id: "g2",
        subjectId: "francais",
        title: "Dissertation",
        value: 10,
        outOf: 20,
        coefficient: 1,
        date: "2026-10-11",
        period: "Trimestre 1",
      },
    ];

    // Moyenne générale = (18 * 5 + 10 * 3) / (5 + 3) = (90 + 30) / 8 = 120 / 8 = 15.00
    const overall = calculateOverallAverage(grades, subjects);
    expect(overall).toBe(15);
  });
});
