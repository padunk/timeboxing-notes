import type { CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import type { Timebox, Note } from "@/lib/supabase";
import { useDeleteNote } from "@/hooks/useNotes";

interface TimeboxCardProps {
  timebox: Timebox & { note: Note };
  style?: CSSProperties;
}

const formatMinutes = (totalMinutes: number) => {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
};

export function TimeboxCard({ timebox, style }: TimeboxCardProps) {
  const navigate = useNavigate();
  const deleteNoteMutation = useDeleteNote();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: timebox.id,
      data: { type: "timebox", timebox },
    });

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

  const liveStart = Math.max(
    6 * 60,
    Math.min(22 * 60 - duration, origStart + dragMinutesChange),
  );
  const liveEnd = liveStart + duration;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...transformStyle,
        opacity: isDragging ? 0.8 : 1,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      {...listeners}
      {...attributes}
      className="relative group bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 hover:shadow-md transition-shadow"
      onClick={() => {
        if (!isDragging) {
          navigate(`/notes/${timebox.note_id}`);
        }
      }}
    >
      <button
        className="absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-500 dark:text-blue-300 transition-opacity"
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
      <div className="flex flex-col h-full">
        <p className="font-medium text-blue-900 dark:text-blue-100 truncate text-sm">
          {timebox.note.title || "Untitled Note"}
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          {formatMinutes(liveStart)} – {formatMinutes(liveEnd)}
        </p>
      </div>
    </div>
  );
}
