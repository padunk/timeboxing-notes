import { useDraggable } from "@dnd-kit/core";
import type { Note } from "@/lib/supabase";

interface DraggableNoteCardProps {
  note: Note;
}

export function DraggableNoteCard({ note }: DraggableNoteCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `note-${note.id}`,
    data: { type: "note", note },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap hover:border-blue-400 dark:hover:border-blue-500 transition-colors select-none shrink-0"
    >
      {note.title || "Untitled Note"}
    </div>
  );
}
