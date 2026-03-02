import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Button,
  Calendar,
  CalendarGrid,
  CalendarGridHeader,
  CalendarGridBody,
  CalendarHeaderCell,
  CalendarCell,
  Heading,
} from "react-aria-components";
import {
  today,
  getLocalTimeZone,
  parseDate,
  startOfMonth,
  endOfMonth,
} from "@internationalized/date";
import type { CalendarDate } from "@internationalized/date";
import {
  useTimeboxesForDateRange,
  useCreateTimebox,
} from "@/hooks/useTimeboxes";
import { useCreateNote } from "@/hooks/useNotes";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface SidebarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export function Sidebar({ selectedDate, onDateSelect }: SidebarProps) {
  const { user } = useAuth();
  const todayDate = today(getLocalTimeZone());

  // Track the currently focused/visible month for fetching timebox indicators
  const [focusedDate, setFocusedDate] = useState<CalendarDate>(() => {
    try {
      return parseDate(selectedDate);
    } catch {
      return todayDate;
    }
  });

  // Compute the visible month range for the timebox query
  const { monthStart, monthEnd } = useMemo(() => {
    const start = startOfMonth(focusedDate);
    const end = endOfMonth(focusedDate);
    return {
      monthStart: start.toString(),
      monthEnd: end.toString(),
    };
  }, [focusedDate]);

  const { data: timeboxes = [] } = useTimeboxesForDateRange(
    user?.id || "",
    monthStart,
    monthEnd,
  );

  // Build a set of dates that have timeboxes for dot indicators
  const datesWithTimeboxes = useMemo(() => {
    const dateSet = new Set<string>();
    timeboxes.forEach((timebox) => {
      dateSet.add(timebox.date);
    });
    return dateSet;
  }, [timeboxes]);

  const createNoteMutation = useCreateNote();
  const createTimeboxMutation = useCreateTimebox();

  const calendarValue = useMemo(() => {
    try {
      return parseDate(selectedDate);
    } catch {
      return todayDate;
    }
  }, [selectedDate, todayDate]);

  const handleCalendarChange = (date: CalendarDate) => {
    onDateSelect(date.toString());
  };

  const handleGoToToday = () => {
    setFocusedDate(todayDate);
    onDateSelect(todayDate.toString());
  };

  const createNewNote = async () => {
    if (!user?.id) return;

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split("T")[0];

      const note = await createNoteMutation.mutateAsync({
        user_id: user.id,
        title: "New Note",
        content: "",
      });

      await createTimeboxMutation.mutateAsync({
        user_id: user.id,
        note_id: note.id,
        date: selectedDate || tomorrowDate,
        start_time: "09:00:00",
        end_time: "10:00:00",
      });

      onDateSelect(selectedDate || tomorrowDate);
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* New Note button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button
          onPress={createNewNote}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Note
        </Button>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-y-auto p-4">
        <Calendar
          aria-label="Date picker"
          value={calendarValue}
          onChange={handleCalendarChange}
          focusedValue={focusedDate}
          onFocusChange={setFocusedDate}
          className="w-full"
        >
          {/* Calendar header: prev / month-year / next */}
          <header className="flex items-center justify-between mb-4">
            <Button
              slot="previous"
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Heading className="text-sm font-semibold text-gray-900 dark:text-white" />
            <Button
              slot="next"
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </header>

          {/* Today button */}
          <div className="flex justify-center mb-3">
            <button
              type="button"
              onClick={handleGoToToday}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Today
            </button>
          </div>

          {/* Calendar grid */}
          <CalendarGrid className="w-full border-collapse">
            <CalendarGridHeader>
              {(day) => (
                <CalendarHeaderCell className="text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 text-center w-10 h-10">
                  {day}
                </CalendarHeaderCell>
              )}
            </CalendarGridHeader>
            <CalendarGridBody>
              {(date) => (
                <CalendarCell
                  date={date}
                  className={({ isSelected, isDisabled, isFocusVisible }) =>
                    `relative flex flex-col items-center justify-center w-10 h-10 rounded-full text-sm cursor-pointer transition-colors outline-none
                    ${
                      isSelected
                        ? "bg-blue-600 text-white font-semibold"
                        : isDisabled
                          ? "text-gray-300 dark:text-gray-600 cursor-default"
                          : date.compare(todayDate) === 0
                            ? "font-semibold text-blue-600 dark:text-blue-400 ring-1 ring-blue-400 dark:ring-blue-500"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                    ${isFocusVisible ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800" : ""}
                  `
                  }
                >
                  {({ formattedDate }) => (
                    <>
                      <span>{formattedDate}</span>
                      {datesWithTimeboxes.has(date.toString()) && (
                        <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                    </>
                  )}
                </CalendarCell>
              )}
            </CalendarGridBody>
          </CalendarGrid>
        </Calendar>

        {/* Timebox count for selected date */}
        {datesWithTimeboxes.has(selectedDate) && (
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {timeboxes.filter((t) => t.date === selectedDate).length} timebox
            {timeboxes.filter((t) => t.date === selectedDate).length !== 1
              ? "es"
              : ""}{" "}
            scheduled
          </p>
        )}
      </div>
    </div>
  );
}
