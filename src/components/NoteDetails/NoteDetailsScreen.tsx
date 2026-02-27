import { Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "react-aria-components";
import { useNote } from "@/hooks/useNotes";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { NoteDetailsContent } from "@/components/NoteDetails/NoteDetailsContent";

export function NoteDetailsScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const notePromise = useNote(id, user?.id);

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
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Suspense fallback={<LoadingSkeleton />}>
          <NoteDetailsContent notePromise={notePromise} />
        </Suspense>
      </main>
    </div>
  );
}
