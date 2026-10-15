import { create } from "zustand";
import { UserSettings } from "../types";

interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  setSchoolLevel: (level: "college" | "lycee" | "superieur") => Promise<void>;
  applyThemeToDOM: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: "dark",
  accentColor: "#6366f1",
  schoolLevel: "lycee",
  autoUpdate: true,
  closeToTray: true,
  launchAtStartup: false,
  reminderNotifications: true,
  onboardingCompleted: false,
  pomodoroWorkDuration: 25,
  pomodoroBreakDuration: 5,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: true,

  loadSettings: async (): Promise<void> => {
    try {
      if (window.api) {
        const fetched = await window.api.db.getSettings();
        set({ settings: fetched, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      get().applyThemeToDOM();
    } catch (err) {
      console.error("Erreur chargement settings:", err);
      set({ isLoading: false });
    }
  },

  updateSettings: async (updates: Partial<UserSettings>): Promise<void> => {
    const updated = { ...get().settings, ...updates };
    set({ settings: updated });
    get().applyThemeToDOM();
    if (window.api) {
      await window.api.db.updateSettings(updates);
    }
  },

  setSchoolLevel: async (
    level: "college" | "lycee" | "superieur",
  ): Promise<void> => {
    if (window.api) {
      await window.api.db.setSchoolLevel(level);
    }
    set((state) => ({
      settings: {
        ...state.settings,
        schoolLevel: level,
        onboardingCompleted: true,
      },
    }));
  },

  applyThemeToDOM: (): void => {
    const { theme, accentColor } = get().settings;
    const root = document.documentElement;

    // Application du mode sombre/clair
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else if (theme === "dark") {
      root.classList.remove("light");
      root.classList.add("dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDark) {
        root.classList.remove("light");
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }
    }

    // Application de la couleur d'accentuation
    if (accentColor) {
      root.style.setProperty("--color-accent", accentColor);
    }
  },
}));
