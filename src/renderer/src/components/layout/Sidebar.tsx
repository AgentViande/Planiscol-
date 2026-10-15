import React from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Columns3,
  Calendar,
  BookOpen,
  GraduationCap,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { usePomodoroStore } from "../../stores/usePomodoroStore";

export type TabType =
  | "dashboard"
  | "todo"
  | "kanban"
  | "calendar"
  | "subjects"
  | "grades"
  | "settings";

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenPomodoro: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenPomodoro,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { isRunning, timeLeft, mode } = usePomodoroStore();

  const navItems = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "todo", label: "Mes Tâches", icon: CheckSquare },
    { id: "kanban", label: "Tableau Kanban", icon: Columns3 },
    { id: "calendar", label: "Agenda & Cours", icon: Calendar },
    { id: "subjects", label: "Matières & Notes", icon: BookOpen },
    { id: "grades", label: "Suivi des Notes", icon: GraduationCap },
  ];

  const formatTimer = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <aside
      className={`h-full bg-slate-950/60 border-r border-white/5 flex flex-col justify-between transition-all duration-300 relative select-none ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Nav Items */}
      <div className="p-3 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white border border-indigo-500/30 shadow-glow"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? "text-accent scale-110" : "group-hover:scale-105"
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-accent rounded-r-full shadow-glow" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Actions: Pomodoro & Settings */}
      <div className="p-3 space-y-2 border-t border-white/5">
        {/* Pomodoro Quick Button */}
        <button
          onClick={onOpenPomodoro}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
            isRunning
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
          title="Minuteur Pomodoro"
        >
          <Clock className={`w-5 h-5 ${isRunning ? "text-amber-400" : ""}`} />
          {!isCollapsed && (
            <div className="flex-1 flex items-center justify-between">
              <span className="font-medium text-xs">
                {isRunning ? (mode === "work" ? "Focus" : "Pause") : "Pomodoro"}
              </span>
              {isRunning && (
                <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-500/30">
                  {formatTimer(timeLeft)}
                </span>
              )}
            </div>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => onTabChange("settings")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
            currentTab === "settings"
              ? "bg-white/10 text-white border border-white/10"
              : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
          }`}
          title="Paramètres"
        >
          <Settings className="w-5 h-5" />
          {!isCollapsed && (
            <span className="font-medium text-sm">Paramètres</span>
          )}
        </button>

        {/* Collapse / Expand Toggle */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center py-2 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors text-xs"
          title={isCollapsed ? "Développer le menu" : "Réduire le menu"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
