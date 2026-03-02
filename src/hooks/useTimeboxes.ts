import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Timebox, Note } from "@/lib/supabase";

export interface TimeboxWithNote extends Timebox {
  note: Note;
}

export interface TimeboxesQueryParams {
  userId: string;
  date: string;
}

export interface UpdateTimeboxParams {
  id: string;
  start_time: string;
  end_time: string;
}

export interface CreateTimeboxParams {
  user_id: string;
  note_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

// Fetch timeboxes for a specific date
export function useTimeboxes({ userId, date }: TimeboxesQueryParams) {
  return useQuery({
    queryKey: ["timeboxes", userId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timeboxes")
        .select(
          `
          *,
          note:notes(*)
        `,
        )
        .eq("user_id", userId)
        .eq("date", date)
        .order("start_time");

      if (error) throw error;

      return (data as TimeboxWithNote[]) || [];
    },
    enabled: !!userId && !!date,
  });
}

// Fetch timeboxes for date tree (multiple dates)
export function useTimeboxesForDateRange(
  userId: string,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: ["timeboxes", "range", userId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timeboxes")
        .select("date, note_id")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate);

      if (error) throw error;

      return data || [];
    },
    enabled: !!userId && !!startDate && !!endDate,
  });
}

// Update timebox mutation with optimistic updates for instant drag/resize feedback
export function useUpdateTimebox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, start_time, end_time }: UpdateTimeboxParams) => {
      const { data, error } = await supabase
        .from("timeboxes")
        .update({
          start_time,
          end_time,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onMutate: async ({ id, start_time, end_time }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["timeboxes"] });

      // Snapshot all timebox queries so we can rollback on error
      const previousQueries = queryClient.getQueriesData<TimeboxWithNote[]>({
        queryKey: ["timeboxes"],
      });

      // Optimistically update every matching cache entry
      queryClient.setQueriesData<TimeboxWithNote[]>(
        { queryKey: ["timeboxes"] },
        (old) =>
          old?.map((tb) =>
            tb.id === id ? { ...tb, start_time, end_time } : tb,
          ),
      );

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      // Rollback to the previous cache state on failure
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      // Always refetch after mutation to sync with server
      queryClient.invalidateQueries({ queryKey: ["timeboxes"] });
    },
  });
}

// Delete timebox mutation
export function useDeleteTimebox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("timeboxes").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeboxes"] });
    },
  });
}

// Create timebox mutation
export function useCreateTimebox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTimeboxParams) => {
      const { data, error } = await supabase
        .from("timeboxes")
        .insert(params)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      // Invalidate all timebox queries to refetch
      queryClient.invalidateQueries({ queryKey: ["timeboxes"] });
    },
  });
}
