import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useDeleteNote } from "@/hooks/useNotes";
import type { CalendarEvent } from "@/lib/calendarHelpers";

interface CalendarEventProps {
  event: CalendarEvent;
}

export function CalendarEventComponent({ event }: CalendarEventProps) {
  const navigate = useNavigate();
  const deleteNoteMutation = useDeleteNote();
  const timebox = event.resource;

  return (
    <div
      className="flex items-start justify-between gap-1 h-full px-1 cursor-pointer group/event"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/notes/${timebox.note_id}`);
      }}
    >
      <span className="font-medium text-sm truncate flex-1">{event.title}</span>
      <button
        className="p-0.5 rounded opacity-0 group-hover/event:opacity-100 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-600 dark:text-blue-300 transition-opacity shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          deleteNoteMutation.mutate({
            id: timebox.note_id,
            userId: timebox.user_id,
          });
        }}
        aria-label="Remove from schedule"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
