import { useRef, useState, useCallback } from "react";
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

// --- Drag-to-create constants & helpers ---
const SCHEDULE_START_MINUTES = 6 * 60; // 6 AM
const SCHEDULE_END_MINUTES = 22 * 60; // 10 PM
const PIXELS_PER_HOUR = 80;
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
const SNAP_MINUTES = 15;
const MIN_DURATION_MINUTES = 15;

const snapTo15 = (minutes: number) =>
  Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;

const clampMinutes = (minutes: number) =>
  Math.max(SCHEDULE_START_MINUTES, Math.min(SCHEDULE_END_MINUTES, minutes));

const minutesToTimeString = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
};

const formatMinutesDisplay = (totalMinutes: number) => {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
};

const hasOverlap = (
  startMinutes: number,
  endMinutes: number,
  existingTimeboxes: Array<{ start_time: string; end_time: string }>,
) => {
  return existingTimeboxes.some((tb) => {
    const [sh, sm] = tb.start_time.split(":").map(Number);
    const [eh, em] = tb.end_time.split(":").map(Number);
    const tbStart = sh * 60 + sm;
    const tbEnd = eh * 60 + em;
    return startMinutes < tbEnd && endMinutes > tbStart;
  });
};

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

  // Hours from 6 AM to 10 PM
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);

  // --- Drag-to-create state ---
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragCreating, setIsDragCreating] = useState(false);
  const [dragStartMinutes, setDragStartMinutes] = useState(0);
  const [dragCurrentMinutes, setDragCurrentMinutes] = useState(0);

  const yToMinutes = useCallback((clientY: number) => {
    if (!gridRef.current) return SCHEDULE_START_MINUTES;
    const rect = gridRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const rawMinutes = SCHEDULE_START_MINUTES + y / PIXELS_PER_MINUTE;
    return clampMinutes(snapTo15(rawMinutes));
  }, []);

  const handleGridPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only primary button
      if (e.button !== 0) return;
      // Don't trigger if clicking on a timebox card
      if ((e.target as HTMLElement).closest("[data-timebox-card]")) return;

      const minutes = yToMinutes(e.clientY);
      setIsDragCreating(true);
      setDragStartMinutes(minutes);
      setDragCurrentMinutes(minutes);
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [yToMinutes],
  );

  const handleGridPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragCreating) return;
      setDragCurrentMinutes(yToMinutes(e.clientY));
    },
    [isDragCreating, yToMinutes],
  );

  const handleGridPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragCreating) return;
      setIsDragCreating(false);

      const finalMinutes = yToMinutes(e.clientY);
      let rangeStart = Math.min(dragStartMinutes, finalMinutes);
      let rangeEnd = Math.max(dragStartMinutes, finalMinutes);

      // Enforce minimum duration
      if (rangeEnd - rangeStart < MIN_DURATION_MINUTES) {
        rangeEnd = rangeStart + MIN_DURATION_MINUTES;
        if (rangeEnd > SCHEDULE_END_MINUTES) {
          rangeEnd = SCHEDULE_END_MINUTES;
          rangeStart = rangeEnd - MIN_DURATION_MINUTES;
        }
      }

      // Check overlap
      if (hasOverlap(rangeStart, rangeEnd, timeboxes)) return;

      const startTime = minutesToTimeString(rangeStart);
      const endTime = minutesToTimeString(rangeEnd);
      onCreateTimebox?.(startTime, endTime);
    },
    [isDragCreating, dragStartMinutes, yToMinutes, timeboxes, onCreateTimebox],
  );

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

  const handleResize = useCallback(
    (id: string, startTime: string, endTime: string) => {
      updateTimeboxMutation
        .mutateAsync({ id, start_time: startTime, end_time: endTime })
        .catch((error) => {
          console.error("Error resizing timebox:", error);
        });
    },
    [updateTimeboxMutation],
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
          <div
            ref={gridRef}
            className={`relative ${
              isDragCreating ? "select-none" : "cursor-crosshair"
            }`}
            style={isDragCreating ? { touchAction: "none" } : undefined}
            onPointerDown={handleGridPointerDown}
            onPointerMove={handleGridPointerMove}
            onPointerUp={handleGridPointerUp}
          >
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
                  onResize={handleResize}
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

            {/* Drag-to-create preview overlay */}
            {isDragCreating &&
              (() => {
                const rangeStart = Math.min(
                  dragStartMinutes,
                  dragCurrentMinutes,
                );
                let rangeEnd = Math.max(dragStartMinutes, dragCurrentMinutes);
                if (rangeEnd - rangeStart < MIN_DURATION_MINUTES) {
                  rangeEnd = rangeStart + MIN_DURATION_MINUTES;
                }
                const overlapping = hasOverlap(rangeStart, rangeEnd, timeboxes);
                const top =
                  (rangeStart - SCHEDULE_START_MINUTES) * PIXELS_PER_MINUTE;
                const height = (rangeEnd - rangeStart) * PIXELS_PER_MINUTE;

                return (
                  <div
                    className={`absolute left-2 right-2 rounded-lg border-2 border-dashed flex items-center justify-center pointer-events-none z-10 transition-colors ${
                      overlapping
                        ? "bg-red-400/30 border-red-500"
                        : "bg-blue-400/30 border-blue-500"
                    }`}
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <span
                      className={`text-sm font-medium ${
                        overlapping
                          ? "text-red-700 dark:text-red-300"
                          : "text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      {formatMinutesDisplay(rangeStart)} –{" "}
                      {formatMinutesDisplay(rangeEnd)}
                      {overlapping && " (overlap)"}
                    </span>
                  </div>
                );
              })()}
          </div>
        </div>
      </div>
    </div>
  );
}
