import React from 'react';
import NotesInterface from './note/index';

interface NoteProps {
  noteId?: string | null;
  onNoteSelect?: (noteId: string | null) => void;
}

const Note: React.FC<NoteProps> = ({ noteId, onNoteSelect }) => {
  return <NotesInterface noteId={noteId} onNoteSelect={onNoteSelect} />;
};

export default Note;