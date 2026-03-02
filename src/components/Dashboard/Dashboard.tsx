import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { TimeBlockSchedule } from "@/components/TimeBlockSchedule";
import { useCreateTimebox } from "@/hooks/useTimeboxes";
import { useCreateNote } from "@/hooks/useNotes";
import { Menu } from "lucide-react";

export function DashboardScreen() {
  const { date: urlDate } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    urlDate || new Date().toISOString().split("T")[0],
  );

  const createTimeboxMutation = useCreateTimebox();
  const createNoteMutation = useCreateNote();

  const userName = user?.email?.split("@")[0] || "User";

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    navigate(`/dashboard/${date}`);
  };

  const handleSlotSelect = async (startTime: string, endTime: string) => {
    if (!user?.id) return;
    try {
      const note = await createNoteMutation.mutateAsync({
        user_id: user.id,
        title: "New Note",
        content: "",
      });
      await createTimeboxMutation.mutateAsync({
        user_id: user.id,
        note_id: note.id,
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
      });
    } catch (error) {
      console.error("Error creating timebox from drag:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Timeboxing Notes
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden md:block">
              Welcome, {userName}
            </span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarCollapsed
              ? "-translate-x-full lg:translate-x-0"
              : "translate-x-0"
          } fixed lg:static inset-y-0 left-0 z-40 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out`}
        >
          <Sidebar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        </aside>

        {/* Overlay for mobile */}
        {!isSidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

        {/* Main Schedule Area */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
            </div>

            <TimeBlockSchedule
              selectedDate={selectedDate}
              onCreateTimebox={handleSlotSelect}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
