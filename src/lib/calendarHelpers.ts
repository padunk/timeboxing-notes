import type { TimeboxWithNote } from "@/hooks/useTimeboxes";

/** RBC event shape carrying the original timebox data in `resource`. */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: TimeboxWithNote;
}

/**
 * Convert a TimeboxWithNote (Supabase row) into an RBC event.
 * `dateStr` is the schedule date in "YYYY-MM-DD" format.
 */
export function timeboxToEvent(
  timebox: TimeboxWithNote,
  dateStr: string,
): CalendarEvent {
  const [startH, startM] = timebox.start_time.split(":").map(Number);
  const [endH, endM] = timebox.end_time.split(":").map(Number);

  const start = new Date(`${dateStr}T00:00:00`);
  start.setHours(startH, startM, 0, 0);

  const end = new Date(`${dateStr}T00:00:00`);
  end.setHours(endH, endM, 0, 0);

  return {
    id: timebox.id,
    title: timebox.note.title || "Untitled Note",
    start,
    end,
    resource: timebox,
  };
}

/**
 * Extract HH:MM:SS time strings from Date objects (for Supabase mutations).
 */
export function datesToTimeStrings(start: Date, end: Date) {
  const fmt = (d: Date) => {
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}:00`;
  };
  return {
    start_time: fmt(start),
    end_time: fmt(end),
  };
}
