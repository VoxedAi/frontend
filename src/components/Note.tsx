import React, { useEffect } from 'react';
import NotesInterface from './note/index';
import { useLayoutState } from '../hooks/useLayoutState';

interface NoteProps {
  noteId?: string | null;
  onNoteSelect?: (noteId: string | null) => void;
}

const Note: React.FC<NoteProps> = ({ noteId, onNoteSelect }) => {
  const [layout, setLayout] = useLayoutState();
  
  // Sync the layout state with the noteId prop whenever it changes
  useEffect(() => {
    if (noteId !== layout.selectedNoteId) {
      setLayout({ 
        selectedNoteId: noteId,
        selectedView: noteId ? 'notes' : layout.selectedView
      });
    }
  }, [noteId, layout.selectedNoteId, layout.selectedView, setLayout]);
  
  return <NotesInterface noteId={layout.selectedNoteId} onNoteSelect={onNoteSelect} />;
};

export default Note;