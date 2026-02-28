import { useDroppable, useDndMonitor } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { useAuth } from "@/contexts/AuthContext";
import { useTimeboxes, useUpdateTimebox } from "@/hooks/useTimeboxes";
import { TimeboxCard } from "./TimeboxCard";

interface HourSlotProps {
  hour: number;
}

function HourSlot({ hour }: HourSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${hour}` });
  return (
    <div
      ref={setNodeRef}
      className={`h-20 border-t border-gray-200 dark:border-gray-700 transition-colors ${
        isOver ? "bg-blue-50 dark:bg-blue-900/20" : ""
      }`}
    />
  );
}

interface TimeBlockScheduleProps {
  selectedDate: string;
}

export function TimeBlockSchedule({ selectedDate }: TimeBlockScheduleProps) {
  const { user } = useAuth();

  const { data: timeboxes = [], isLoading } = useTimeboxes({
    userId: user?.id || "",
    date: selectedDate,
  });

  const updateTimeboxMutation = useUpdateTimebox();

  // Hours from 6 AM to 10 PM
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);

  useDndMonitor({
    onDragEnd(event: DragEndEvent) {
      const { active, delta } = event;
      if (active.data.current?.type !== "timebox") return;
      if (!delta.y || delta.y === 0) return;

      // Calculate time change (15-minute increments)
      const pixelsPerHour = 80;
      const minutesPerPixel = 60 / pixelsPerHour;
      const minutesChange = Math.round((delta.y * minutesPerPixel) / 15) * 15;

      const timebox = timeboxes.find((t) => t.id === active.id);
      if (!timebox) return;

      // Parse current times
      const [startHour, startMinute] = timebox.start_time
        .split(":")
        .map(Number);
      const [endHour, endMinute] = timebox.end_time.split(":").map(Number);

      const origStartMinutes = startHour * 60 + startMinute;
      const origEndMinutes = endHour * 60 + endMinute;
      const duration = origEndMinutes - origStartMinutes;

      // Clamp start to keep the full timebox within 6 AM – 10 PM, preserving duration
      let newStartMinutes = origStartMinutes + minutesChange;
      newStartMinutes = Math.max(
        6 * 60,
        Math.min(22 * 60 - duration, newStartMinutes),
      );
      const newEndMinutes = newStartMinutes + duration;

      const newStartTime = `${String(Math.floor(newStartMinutes / 60)).padStart(2, "0")}:${String(newStartMinutes % 60).padStart(2, "0")}:00`;
      const newEndTime = `${String(Math.floor(newEndMinutes / 60)).padStart(2, "0")}:${String(newEndMinutes % 60).padStart(2, "0")}:00`;

      updateTimeboxMutation
        .mutateAsync({
          id: timebox.id,
          start_time: newStartTime,
          end_time: newEndTime,
        })
        .catch((error) => {
          console.error("Error updating timebox:", error);
        });
    },
  });

  const getTimeboxPosition = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    const scheduleStartMinutes = 6 * 60; // 6 AM
    const pixelsPerMinute = 80 / 60; // 80px per hour

    const top = (startMinutes - scheduleStartMinutes) * pixelsPerMinute;
    const height = (endMinutes - startMinutes) * pixelsPerMinute;

    return { top, height };
  };

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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex">
        {/* Time labels */}
        <div className="w-20 border-r border-gray-200 dark:border-gray-700">
          <div className="h-12" /> {/* Header spacer */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-20 border-t border-gray-200 dark:border-gray-700 flex items-start justify-end pr-2 pt-1"
            >
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {hour === 0
                  ? "12 AM"
                  : hour === 12
                    ? "12 PM"
                    : hour < 12
                      ? `${hour} AM`
                      : `${hour - 12} PM`}
              </span>
            </div>
          ))}
        </div>

        {/* Schedule area */}
        <div className="flex-1 relative">
          <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                "en-US",
                {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                },
              )}
            </span>
          </div>

          {/* Hour grid */}
          <div className="relative">
            {hours.map((hour) => (
              <HourSlot key={hour} hour={hour} />
            ))}

            {/* Timeboxes */}
            {timeboxes.map((timebox) => {
              const { top, height } = getTimeboxPosition(
                timebox.start_time,
                timebox.end_time,
              );
              return (
                <TimeboxCard
                  key={timebox.id}
                  timebox={timebox}
                  style={{
                    position: "absolute",
                    top: `${top}px`,
                    height: `${height}px`,
                    left: "8px",
                    right: "8px",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
