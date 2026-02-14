import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/supabase";

export interface CreateNoteParams {
  user_id: string;
  title: string;
  content: string;
}

export interface UpdateNoteParams {
  id: string;
  title: string;
  content: string;
  user_id: string;
}

// Fetch a single note by ID
export function useNote(id: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      if (!id || !userId) throw new Error("Missing ID or userId");

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      return data as Note;
    },
    enabled: !!id && !!userId,
  });
}

// Create note mutation
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateNoteParams) => {
      const { data, error } = await supabase
        .from("notes")
        .insert(params)
        .select()
        .single();

      if (error) throw error;

      return data as Note;
    },
    onSuccess: () => {
      // Invalidate notes queries
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

// Update note mutation
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, content, user_id }: UpdateNoteParams) => {
      const { data, error } = await supabase
        .from("notes")
        .update({
          title,
          content,
        })
        .eq("id", id)
        .eq("user_id", user_id)
        .select()
        .single();

      if (error) throw error;

      return data as Note;
    },
    onSuccess: (data) => {
      // Update the specific note in cache
      queryClient.setQueryData(["note", data.id], data);
      // Invalidate notes list if needed
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
