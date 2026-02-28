import { useNavigate } from "react-router-dom";
import { NoteEditor } from "../NoteEditor";
import type { Note } from "@/lib/supabase";

export function NoteDetailsContent({ note }: { note: Note }) {
  const navigate = useNavigate();

  if (!note) {
    navigate("/dashboard");
    return null;
  }

  return <NoteEditor note={note} />;
}
