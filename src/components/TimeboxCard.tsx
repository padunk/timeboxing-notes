import type { CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import type { Timebox, Note } from "@/lib/supabase";

interface TimeboxCardProps {
  timebox: Timebox & { note: Note };
  style?: CSSProperties;
}

export function TimeboxCard({ timebox, style }: TimeboxCardProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: timebox.id,
    });

  const transformStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...transformStyle,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      {...listeners}
      {...attributes}
      className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 hover:shadow-md transition-shadow"
      onClick={() => {
        // Only navigate if not dragging
        if (!isDragging) {
          navigate(`/notes/${timebox.note_id}`);
        }
      }}
    >
      <div className="flex flex-col h-full">
        <p className="font-medium text-blue-900 dark:text-blue-100 truncate text-sm">
          {timebox.note.title || "Untitled Note"}
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          {formatTime(timebox.start_time)} - {formatTime(timebox.end_time)}
        </p>
      </div>
    </div>
  );
}
