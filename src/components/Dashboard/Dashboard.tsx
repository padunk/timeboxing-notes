import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { TimeBlockSchedule } from "@/components/TimeBlockSchedule";

export function DashboardScreen() {
  const { date: urlDate } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    urlDate || new Date().toISOString().split("T")[0],
  );

  const userName = user?.email?.split("@")[0] || "User";

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    navigate(`/dashboard/${date}`);
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
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
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleDateSelect(new Date().toISOString().split("T")[0])
                  }
                  className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    handleDateSelect(tomorrow.toISOString().split("T")[0]);
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  onClick={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    handleDateSelect(nextWeek.toISOString().split("T")[0]);
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Next Week
                </button>
              </div>
            </div>

            {/* Placeholder for TimeBlockSchedule component */}
            <TimeBlockSchedule selectedDate={selectedDate} />
          </div>
        </main>
      </div>
    </div>
  );
}
