import { useCallback, useMemo } from "react";
import { Calendar } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import type { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import { useAuth } from "@/contexts/AuthContext";
import { useTimeboxes, useUpdateTimebox } from "@/hooks/useTimeboxes";
import { localizer } from "@/lib/calendarLocalizer";
import {
  timeboxToEvent,
  datesToTimeStrings,
  type CalendarEvent,
} from "@/lib/calendarHelpers";
import { CalendarEventComponent } from "./CalendarEvent";

const DnDCalendar = withDragAndDrop(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Calendar as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) as React.ComponentType<any>;

// Schedule bounds: 6 AM – 10 PM
const MIN_TIME = new Date();
MIN_TIME.setHours(6, 0, 0, 0);

const MAX_TIME = new Date();
MAX_TIME.setHours(22, 0, 0, 0);

interface TimeBlockScheduleProps {
  selectedDate: string;
  onCreateTimebox?: (startTime: string, endTime: string) => void;
}

export function TimeBlockSchedule({
  selectedDate,
  onCreateTimebox,
}: TimeBlockScheduleProps) {
  const { user } = useAuth();

  const { data: timeboxes = [], isLoading } = useTimeboxes({
    userId: user?.id || "",
    date: selectedDate,
  });

  const updateTimeboxMutation = useUpdateTimebox();

  // Convert timeboxes → RBC events
  const events: CalendarEvent[] = useMemo(
    () => timeboxes.map((tb) => timeboxToEvent(tb, selectedDate)),
    [timeboxes, selectedDate],
  );

  // Current date for the calendar view
  const calendarDate = useMemo(
    () => new Date(selectedDate + "T00:00:00"),
    [selectedDate],
  );

  // --- Handlers ---

  /** Drag-to-select an empty slot → create a new timebox */
  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      const { start_time, end_time } = datesToTimeStrings(start, end);
      onCreateTimebox?.(start_time, end_time);
    },
    [onCreateTimebox],
  );

  /** Move an existing event via drag */
  const handleEventDrop = useCallback(
    ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
      const { start_time, end_time } = datesToTimeStrings(
        new Date(start),
        new Date(end),
      );
      updateTimeboxMutation
        .mutateAsync({ id: event.id, start_time, end_time })
        .catch((error: unknown) => {
          console.error("Error moving timebox:", error);
        });
    },
    [updateTimeboxMutation],
  );

  /** Resize an event from its edges */
  const handleEventResize = useCallback(
    ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
      const { start_time, end_time } = datesToTimeStrings(
        new Date(start),
        new Date(end),
      );
      updateTimeboxMutation
        .mutateAsync({ id: event.id, start_time, end_time })
        .catch((error: unknown) => {
          console.error("Error resizing timebox:", error);
        });
    },
    [updateTimeboxMutation],
  );

  const components = useMemo(
    () => ({
      event: CalendarEventComponent,
    }),
    [],
  );

  const eventPropGetter = useCallback(
    () => ({
      className:
        "!bg-blue-100 !border-blue-300 !text-blue-900 dark:!bg-blue-900 dark:!border-blue-700 dark:!text-blue-100 !rounded-lg",
    }),
    [],
  );

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Loading schedule...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden rbc-wrapper">
      <DnDCalendar
        localizer={localizer}
        events={events}
        date={calendarDate}
        onNavigate={() => {
          /* navigation handled by Sidebar */
        }}
        view="day"
        onView={() => {
          /* single view */
        }}
        views={["day"]}
        toolbar={false}
        min={MIN_TIME}
        max={MAX_TIME}
        step={15}
        timeslots={2}
        selectable
        resizable
        draggableAccessor={() => true}
        resizableAccessor={() => true}
        onSelectSlot={handleSelectSlot}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        components={components}
        eventPropGetter={eventPropGetter}
        style={{ minHeight: 700 }}
      />
    </div>
  );
}
