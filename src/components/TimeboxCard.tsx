import { useState, useCallback, useEffect, type CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";
import { X, GripHorizontal } from "lucide-react";
import type { Timebox, Note } from "@/lib/supabase";
import { useDeleteNote } from "@/hooks/useNotes";

// --- Resize constants (must match TimeBlockSchedule) ---
const SCHEDULE_START_MINUTES = 6 * 60;
const SCHEDULE_END_MINUTES = 22 * 60;
const PIXELS_PER_HOUR = 80;
const MINUTES_PER_PIXEL = 60 / PIXELS_PER_HOUR;
const SNAP_MINUTES = 15;
const MIN_DURATION_MINUTES = 15;

const snapTo15 = (minutes: number) =>
  Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;

interface TimeboxCardProps {
  timebox: Timebox & { note: Note };
  style?: CSSProperties;
  onResize?: (id: string, startTime: string, endTime: string) => void;
}

const formatMinutes = (totalMinutes: number) => {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
};

const minutesToTimeString = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
};

export function TimeboxCard({ timebox, style, onResize }: TimeboxCardProps) {
  const deleteNoteMutation = useDeleteNote();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: timebox.id,
      data: { type: "timebox", timebox },
    });

  // --- Resize state ---
  const [resizeEdge, setResizeEdge] = useState<"top" | "bottom" | null>(null);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeDeltaMinutes, setResizeDeltaMinutes] = useState(0);

  const transformStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Compute live time snapped to 15-min increments during drag
  const pixelsPerHour = 80;
  const minutesPerPixel = 60 / pixelsPerHour;
  const dragMinutesChange = transform
    ? Math.round((transform.y * minutesPerPixel) / 15) * 15
    : 0;

  const [startHour, startMinute] = timebox.start_time.split(":").map(Number);
  const [endHour, endMinute] = timebox.end_time.split(":").map(Number);
  const origStart = startHour * 60 + startMinute;
  const origEnd = endHour * 60 + endMinute;
  const duration = origEnd - origStart;

  // --- Compute live values during resize ---
  let liveStart: number;
  let liveEnd: number;

  if (resizeEdge === "top") {
    const newStart = Math.max(
      SCHEDULE_START_MINUTES,
      Math.min(origEnd - MIN_DURATION_MINUTES, origStart + resizeDeltaMinutes),
    );
    liveStart = newStart;
    liveEnd = origEnd;
  } else if (resizeEdge === "bottom") {
    const newEnd = Math.min(
      SCHEDULE_END_MINUTES,
      Math.max(origStart + MIN_DURATION_MINUTES, origEnd + resizeDeltaMinutes),
    );
    liveStart = origStart;
    liveEnd = newEnd;
  } else {
    // Normal drag (dnd-kit reposition)
    liveStart = Math.max(
      SCHEDULE_START_MINUTES,
      Math.min(SCHEDULE_END_MINUTES - duration, origStart + dragMinutesChange),
    );
    liveEnd = liveStart + duration;
  }

  // --- Compute style overrides during resize ---
  const resizeStyleOverride: CSSProperties | undefined =
    resizeEdge && style
      ? (() => {
          const pixelsPerMinute = PIXELS_PER_HOUR / 60;
          const newTop = (liveStart - SCHEDULE_START_MINUTES) * pixelsPerMinute;
          const newHeight = (liveEnd - liveStart) * pixelsPerMinute;
          return {
            ...style,
            top: `${newTop}px`,
            height: `${newHeight}px`,
          };
        })()
      : undefined;

  // --- Resize pointer event handlers (window-level for smooth tracking) ---
  const handleResizePointerDown = useCallback(
    (edge: "top" | "bottom", e: React.PointerEvent) => {
      e.stopPropagation(); // prevent @dnd-kit drag
      e.preventDefault();
      setResizeEdge(edge);
      setResizeStartY(e.clientY);
      setResizeDeltaMinutes(0);
    },
    [],
  );

  useEffect(() => {
    if (!resizeEdge) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaY = e.clientY - resizeStartY;
      const rawDelta = deltaY * MINUTES_PER_PIXEL;
      setResizeDeltaMinutes(snapTo15(rawDelta));
    };

    const handlePointerUp = () => {
      if (onResize) {
        onResize(
          timebox.id,
          minutesToTimeString(liveStart),
          minutesToTimeString(liveEnd),
        );
      }
      setResizeEdge(null);
      setResizeDeltaMinutes(0);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [resizeEdge, resizeStartY, timebox.id, liveStart, liveEnd, onResize]);

  const isResizing = resizeEdge !== null;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...(resizeStyleOverride || style),
        ...(!isResizing ? transformStyle : undefined),
        opacity: isDragging ? 0.8 : 1,
        cursor: isDragging ? "grabbing" : isResizing ? "ns-resize" : "grab",
      }}
      {...(!isResizing ? listeners : {})}
      {...attributes}
      data-timebox-card
      className={`relative group bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg hover:shadow-md transition-shadow ${
        isResizing ? "z-20 ring-2 ring-blue-400 select-none" : ""
      }`}
    >
      {/* Top resize handle */}
      <div
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-10 flex items-center justify-center group/handle"
        onPointerDown={(e) => handleResizePointerDown("top", e)}
      >
        <GripHorizontal className="w-4 h-2.5 text-blue-400 opacity-0 group-hover:opacity-60 group-hover/handle:opacity-100 transition-opacity" />
      </div>

      {/* Card content */}
      <div className="px-3 py-2 flex flex-col h-full min-h-0 overflow-hidden">
        <div className="flex items-start justify-between gap-1">
          <p className="font-medium text-blue-900 dark:text-blue-100 truncate text-sm flex-1">
            {timebox.note.title || "Untitled Note"}
          </p>
          <button
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-500 dark:text-blue-300 transition-opacity shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              deleteNoteMutation.mutate({
                id: timebox.note_id,
                userId: timebox.user_id,
              });
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Remove from schedule"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-auto">
          {formatMinutes(liveStart)} – {formatMinutes(liveEnd)}
        </p>
      </div>

      {/* Bottom resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-10 flex items-center justify-center group/handle"
        onPointerDown={(e) => handleResizePointerDown("bottom", e)}
      >
        <GripHorizontal className="w-4 h-2.5 text-blue-400 opacity-0 group-hover:opacity-60 group-hover/handle:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
