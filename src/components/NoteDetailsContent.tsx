import { use } from "react";
import { useNavigate } from "react-router-dom";
import { NoteEditor } from "./NoteEditor";

export function NoteDetailsContent({
  notePromise,
}: {
  notePromise: Promise<any>;
}) {
  const note = use(notePromise);
  const navigate = useNavigate();

  if (!note) {
    navigate("/dashboard");
    return null;
  }

  return <NoteEditor note={note} />;
}
