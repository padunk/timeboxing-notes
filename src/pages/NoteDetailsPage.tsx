import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button, TextField, Label, Input } from "react-aria-components";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/supabase";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ThemeToggle } from "@/components/ThemeToggle";

export function NoteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved",
  );
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const loadNote = useCallback(async () => {
    if (!id || !user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setNote(data);
      setTitle(data.title);
      setContent(data.content);
    } catch (error) {
      console.error("Error loading note:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  const saveNote = useCallback(
    async (newTitle: string, newContent: string) => {
      if (!id || !user?.id) return;

      try {
        setSaveStatus("saving");
        const { error } = await supabase
          .from("notes")
          .update({
            title: newTitle,
            content: newContent,
          })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        setSaveStatus("saved");
      } catch (error) {
        console.error("Error saving note:", error);
        setSaveStatus("unsaved");
      }
    },
    [id, user],
  );

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSaveStatus("unsaved");

    // Clear existing timeout
    if (saveTimeout) clearTimeout(saveTimeout);

    // Set new timeout for auto-save
    const timeout = setTimeout(() => {
      saveNote(value, content);
    }, 1000);

    setSaveTimeout(timeout);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setSaveStatus("unsaved");

    // Clear existing timeout
    if (saveTimeout) clearTimeout(saveTimeout);

    // Set new timeout for auto-save
    const timeout = setTimeout(() => {
      saveNote(title, value);
    }, 1000);

    setSaveTimeout(timeout);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading note...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Note not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onPress={() => navigate("/dashboard")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Button>
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
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Title */}
          <TextField className="flex flex-col">
            <Label className="sr-only">Note Title</Label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled Note"
              className="text-4xl font-bold bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
            />
          </TextField>

          {/* Rich Text Editor */}
          <RichTextEditor content={content} onChange={handleContentChange} />

          {/* Metadata */}
          <div className="text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p>Created: {new Date(note.created_at).toLocaleString()}</p>
            <p>Last updated: {new Date(note.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
