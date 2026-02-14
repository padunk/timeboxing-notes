import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TextField, Label, Input } from "react-aria-components";
import { useUpdateNote } from "@/hooks/useNotes";
import { RichTextEditor } from "@/components/RichTextEditor";
import type { Note } from "@/lib/supabase";

interface NoteEditorProps {
  note: Note;
}

export function NoteEditor({ note }: NoteEditorProps) {
  const { user } = useAuth();
  const updateNoteMutation = useUpdateNote();

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const saveStatus = updateNoteMutation.isPending
    ? "saving"
    : updateNoteMutation.isSuccess
      ? "saved"
      : "unsaved";

  const handleTitleChange = (value: string) => {
    setTitle(value);

    if (saveTimeout) clearTimeout(saveTimeout);

    const timeout = setTimeout(() => {
      if (user?.id) {
        updateNoteMutation.mutate({
          id: note.id,
          user_id: user.id,
          title: value,
          content,
        });
      }
    }, 1000);

    setSaveTimeout(timeout);
  };

  const handleContentChange = (value: string) => {
    setContent(value);

    if (saveTimeout) clearTimeout(saveTimeout);

    const timeout = setTimeout(() => {
      if (user?.id) {
        updateNoteMutation.mutate({
          id: note.id,
          user_id: user.id,
          title,
          content: value,
        });
      }
    }, 1000);

    setSaveTimeout(timeout);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "All changes saved"}
          {saveStatus === "unsaved" && "Unsaved changes"}
        </span>
        <div
          className={`w-2 h-2 rounded-full ${
            saveStatus === "saving"
              ? "bg-yellow-500"
              : saveStatus === "saved"
                ? "bg-green-500"
                : "bg-gray-400"
          }`}
        />
      </div>
      <TextField className="flex flex-col">
        <Label className="sr-only">Note Title</Label>
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled Note"
          className="text-4xl font-bold bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
        />
      </TextField>

      <RichTextEditor content={content} onChange={handleContentChange} />

      <div className="text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p>Created: {new Date(note.created_at).toLocaleString()}</p>
        <p>Last updated: {new Date(note.updated_at).toLocaleString()}</p>
      </div>
    </div>
  );
}
