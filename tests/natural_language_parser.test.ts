import { describe, it, expect } from "vitest";
import { parseNaturalLanguageTask } from "../src/renderer/src/utils/naturalLanguageParser";
import { Subject } from "../src/renderer/src/types";

describe("Analyseur en langage naturel (Natural Language Parser)", () => {
  const dummySubjects: Subject[] = [
    {
      id: "sub-maths",
      name: "Mathématiques",
      category: "Sciences",
      color: "#3b82f6",
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "sub-physique",
      name: "Physique-Chimie",
      category: "Sciences",
      color: "#06b6d4",
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "sub-histoire",
      name: "Histoire-Géographie",
      category: "Sciences Humaines",
      color: "#f97316",
      createdAt: "",
      updatedAt: "",
    },
  ];

  it('Analyse avec succès: "Maths exo p.45 vendredi 18h priorité haute #important"', () => {
    const input = "Maths exo p.45 vendredi 18h priorité haute #important";
    const result = parseNaturalLanguageTask(input, dummySubjects);

    expect(result.subjectId).toBe("sub-maths");
    expect(result.priority).toBe("high");
    expect(result.type).toBe("devoir");
    expect(result.tags).toContain("important");
    expect(result.title).toContain("exo p.45");
    expect(result.dueDate).toBeDefined();
    if (result.dueDate) {
      const date = new Date(result.dueDate);
      expect(date.getHours()).toBe(18);
    }
  });

  it('Analyse avec succès: "Contrôle Physique demain 14h durée 1h30"', () => {
    const input = "Contrôle Physique demain 14h durée 1h30";
    const result = parseNaturalLanguageTask(input, dummySubjects);

    expect(result.subjectId).toBe("sub-physique");
    expect(result.type).toBe("controle");
    expect(result.estimatedDuration).toBe(90); // 1h30 = 90min
    expect(result.dueDate).toBeDefined();
    if (result.dueDate) {
      const date = new Date(result.dueDate);
      expect(date.getHours()).toBe(14);
    }
  });

  it("Gère convenablement une saisie brute sans date ni matière", () => {
    const input = "Acheter un compas et une règle";
    const result = parseNaturalLanguageTask(input, dummySubjects);

    expect(result.title).toBe("Acheter un compas et une règle");
    expect(result.subjectId).toBeUndefined();
    expect(result.priority).toBe("medium");
    expect(result.type).toBe("devoir");
    expect(result.tags).toHaveLength(0);
  });
});
