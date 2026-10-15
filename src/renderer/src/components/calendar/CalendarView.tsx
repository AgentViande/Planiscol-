import React, { useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin, {
  EventResizeDoneArg,
} from "@fullcalendar/interaction";
import { EventDropArg, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { useTaskStore } from "../../stores/useTaskStore";
import { useSubjectStore } from "../../stores/useSubjectStore";
import { useTimetableStore } from "../../stores/useTimetableStore";
import { Plus } from "lucide-react";

interface CalendarViewProps {
  onSelectTask: (taskId: string) => void;
  onOpenCreateTask: (prefillDate?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectTask,
  onOpenCreateTask,
}) => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const { tasks, saveTask } = useTaskStore();
  const { getSubjectById } = useSubjectStore();
  const { slots } = useTimetableStore();

  // 1. Conversion des tâches en événements FullCalendar
  const taskEvents = tasks
    .filter((t) => t.dueDate || t.startDate)
    .map((t) => {
      const subject = getSubjectById(t.subjectId);
      const start = t.startDate || t.dueDate!;
      let end: string | undefined = undefined;

      if (t.estimatedDuration && t.dueDate) {
        const d = new Date(t.dueDate);
        d.setMinutes(d.getMinutes() + t.estimatedDuration);
        end = d.toISOString();
      }

      return {
        id: t.id,
        title: `${t.priority === "high" ? "🔴 " : ""}${t.title}`,
        start,
        end,
        backgroundColor: subject ? subject.color : "#6366f1",
        borderColor: subject ? subject.color : "#4f46e5",
        textColor: "#ffffff",
        extendedProps: {
          taskId: t.id,
          priority: t.priority,
          status: t.status,
          type: t.type,
        },
      };
    });

  // 2. Conversion des créneaux de cours hebdomadaires (Background events en filigrane)
  const timetableEvents = slots.map((s) => {
    const subject = getSubjectById(s.subjectId);
    return {
      id: `tt-${s.id}`,
      title: `${subject ? subject.name : "Cours"}${s.room ? ` (${s.room})` : ""}`,
      startTime: s.startTime,
      endTime: s.endTime,
      daysOfWeek: [s.dayOfWeek % 7], // FullCalendar: 0 = Dimanche, 1 = Lundi, etc.
      display: "background",
      color: subject ? `${subject.color}20` : "rgba(99, 102, 241, 0.1)",
    };
  });

  const allEvents = [...taskEvents, ...timetableEvents];

  // Gestion du Drag & Drop d'un événement
  const handleEventDrop = async (arg: EventDropArg): Promise<void> => {
    const taskId = arg.event.extendedProps.taskId;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStart = arg.event.start?.toISOString();
    const newEnd = arg.event.end?.toISOString();
    let duration = task.estimatedDuration;

    if (arg.event.start && arg.event.end) {
      const diffMs = arg.event.end.getTime() - arg.event.start.getTime();
      duration = Math.round(diffMs / (1000 * 60));
    }

    await saveTask({
      ...task,
      startDate: newStart,
      dueDate: newStart,
      estimatedDuration: duration,
      updatedAt: new Date().toISOString(),
    });
  };

  // Gestion du redimensionnement de durée
  const handleEventResize = async (arg: EventResizeDoneArg): Promise<void> => {
    const taskId = arg.event.extendedProps.taskId;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !arg.event.start || !arg.event.end) return;

    const diffMs = arg.event.end.getTime() - arg.event.start.getTime();
    const newDuration = Math.round(diffMs / (1000 * 60));

    await saveTask({
      ...task,
      estimatedDuration: newDuration,
      updatedAt: new Date().toISOString(),
    });
  };

  // Clic sur un créneau vide
  const handleDateSelect = (selectInfo: DateSelectArg): void => {
    onOpenCreateTask(selectInfo.startStr);
  };

  // Clic sur un événement
  const handleEventClick = (clickInfo: EventClickArg): void => {
    const taskId = clickInfo.event.extendedProps.taskId;
    if (taskId) {
      onSelectTask(taskId);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-4 overflow-hidden select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">
            Agenda Scolaire
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Glissez-déposez pour replanifier, cliquez sur un créneau pour
            ajouter une tâche.
          </p>
        </div>

        <button
          onClick={() => onOpenCreateTask()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un devoir</span>
        </button>
      </div>

      {/* Calendar Container */}
      <div className="flex-1 glass-panel p-4 rounded-2xl overflow-hidden flex flex-col">
        <FullCalendar
          ref={calendarRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
          ]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          buttonText={{
            today: "Aujourd'hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
            list: "Planning",
          }}
          locale="fr"
          firstDay={1} // Semaine commence le lundi
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          nowIndicator={true}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={allEvents}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="100%"
        />
      </div>
    </div>
  );
};
