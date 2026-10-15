import React, { useEffect, useState } from "react";
import { TitleBar } from "./components/layout/TitleBar";
import { Sidebar, TabType } from "./components/layout/Sidebar";
import { DashboardView } from "./components/dashboard/DashboardView";
import { TodoView } from "./components/todo/TodoView";
import { KanbanView } from "./components/kanban/KanbanView";
import { CalendarView } from "./components/calendar/CalendarView";
import { SubjectsView } from "./components/subjects/SubjectsView";
import { GradesView } from "./components/grades/GradesView";
import { SettingsView } from "./components/settings/SettingsView";

import { QuickAddModal } from "./components/quickadd/QuickAddModal";
import { CommandPaletteModal } from "./components/commandpalette/CommandPaletteModal";
import { TaskDetailModal } from "./components/todo/TaskDetailModal";
import { SubjectNotesModal } from "./components/subjects/SubjectNotesModal";
import { PomodoroModal } from "./components/pomodoro/PomodoroModal";
import { OnboardingModal } from "./components/onboarding/OnboardingModal";

import { useSettingsStore } from "./stores/useSettingsStore";
import { useSubjectStore } from "./stores/useSubjectStore";
import { useTaskStore } from "./stores/useTaskStore";
import { useTimetableStore } from "./stores/useTimetableStore";
import { useGradeStore } from "./stores/useGradeStore";
import { Subject } from "./types";

export const App: React.FC = () => {
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const [currentTab, setCurrentTab] = useState<TabType>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [notesSubject, setNotesSubject] = useState<Subject | null>(null);

  const { loadSubjects } = useSubjectStore();
  const { loadTasks, setSelectedTaskId: setStoreSelectedTaskId } =
    useTaskStore();
  const { loadTimetable } = useTimetableStore();
  const { loadGrades } = useGradeStore();

  // Initial load
  useEffect(() => {
    loadSettings();
    loadSubjects();
    loadTasks();
    loadTimetable();
    loadGrades();

    // Restauration du dernier onglet utilisé
    if (
      settings.lastActiveTab &&
      [
        "dashboard",
        "todo",
        "kanban",
        "calendar",
        "subjects",
        "grades",
        "settings",
      ].includes(settings.lastActiveTab)
    ) {
      setCurrentTab(settings.lastActiveTab as TabType);
    }

    // IPC shortcut listener from Main Process (Ctrl+Shift+A / Tray)
    if (window.api?.on) {
      const unsub = window.api.on.quickAdd(() => {
        setIsQuickAddOpen(true);
      });
      return () => unsub();
    }
  }, [settings.lastActiveTab]);

  const handleTabChange = (tab: TabType): void => {
    setCurrentTab(tab);
    updateSettings({ lastActiveTab: tab });
  };

  // Global Keyboard Shortcuts (Ctrl+Space, Ctrl+K, Ctrl+N, Ctrl+1/2/3/4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ignorer si l'utilisateur est dans un champ de saisie
      const isInput = ["INPUT", "TEXTAREA"].includes(
        (e.target as HTMLElement).tagName,
      );

      // Ctrl+Space ou Ctrl+N pour Quick Add
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.code === "Space" || (!isInput && e.key.toLowerCase() === "n"))
      ) {
        e.preventDefault();
        setIsQuickAddOpen((prev) => !prev);
      }
      // Ctrl+K pour Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Raccourcis numériques de navigation (Ctrl+1: Dashboard, Ctrl+2: Todo, Ctrl+3: Kanban, Ctrl+4: Agenda)
      if ((e.ctrlKey || e.metaKey) && !isInput) {
        if (e.key === "1") {
          e.preventDefault();
          handleTabChange("dashboard");
        } else if (e.key === "2") {
          e.preventDefault();
          handleTabChange("todo");
        } else if (e.key === "3") {
          e.preventDefault();
          handleTabChange("kanban");
        } else if (e.key === "4") {
          e.preventDefault();
          handleTabChange("calendar");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpenTask = (taskId: string): void => {
    setSelectedTaskId(taskId);
    setStoreSelectedTaskId(taskId);
    setIsTaskDetailOpen(true);
  };

  const handleCreateTask = (): void => {
    setSelectedTaskId(null);
    setStoreSelectedTaskId(null);
    setIsTaskDetailOpen(true);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-slate-100 overflow-hidden font-sans">
      {/* 1. Custom Frameless Titlebar */}
      <TitleBar
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* 2. Main Work Area: Sidebar + Active View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onTabChange={handleTabChange}
          onOpenPomodoro={() => setIsPomodoroOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main className="flex-1 h-full overflow-hidden relative">
          {currentTab === "dashboard" && (
            <DashboardView
              onNavigateToTab={(tab) => handleTabChange(tab)}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              onSelectTask={handleOpenTask}
            />
          )}

          {currentTab === "todo" && (
            <TodoView
              onOpenCreateTask={handleCreateTask}
              onSelectTask={handleOpenTask}
              onNavigateToTab={(tab) => handleTabChange(tab)}
            />
          )}

          {currentTab === "kanban" && (
            <KanbanView
              onOpenCreateTask={handleCreateTask}
              onSelectTask={handleOpenTask}
              onNavigateToTab={(tab) => handleTabChange(tab)}
            />
          )}

          {currentTab === "calendar" && (
            <CalendarView
              onSelectTask={handleOpenTask}
              onOpenCreateTask={handleCreateTask}
            />
          )}

          {currentTab === "subjects" && (
            <SubjectsView onOpenNotes={(subject) => setNotesSubject(subject)} />
          )}

          {currentTab === "grades" && <GradesView />}

          {currentTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* 3. Global Modals */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenPomodoro={() => setIsPomodoroOpen(true)}
        onOpenCreateTask={handleCreateTask}
      />

      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTaskId(null);
        }}
      />

      <SubjectNotesModal
        subject={notesSubject}
        isOpen={!!notesSubject}
        onClose={() => setNotesSubject(null)}
      />

      <PomodoroModal
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
      />

      <OnboardingModal />
    </div>
  );
};
