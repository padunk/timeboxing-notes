import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "react-aria-components";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNote, useDeleteNote } from "@/hooks/useNotes";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { NoteDetailsContent } from "@/components/NoteDetails/NoteDetailsContent";

export function NoteDetailsScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: note, isLoading } = useNote(id, user?.id);
  const deleteNoteMutation = useDeleteNote();

  const handleDelete = async () => {
    if (!note || !user?.id) return;
    await deleteNoteMutation.mutateAsync({ id: note.id, userId: user.id });
    navigate("/dashboard");
  };

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
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {note && (
              <Button
                onPress={handleDelete}
                isDisabled={deleteNoteMutation.isPending}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Delete note"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {isLoading ? (
          <LoadingSkeleton />
        ) : note ? (
          <NoteDetailsContent note={note} />
        ) : null}
      </main>
    </div>
  );
}
