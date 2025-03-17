import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { getSpaceFiles, deleteFile } from '../../services/fileUpload';
import toast from 'react-hot-toast';
import { useSupabaseUser } from '../../contexts/UserContext';
import NoteModal from '../NoteModal';
import NoteList from './NoteList';
import NoteEditor from './NoteEditor';
import type { SpaceFile } from '../../types/space';

// Extended file type with visibility state
interface ExtendedFile extends SpaceFile {
  visible: boolean;
  isProcessing?: boolean;
  isDeletingFile?: boolean;
}

interface NotesInterfaceProps {
  noteId?: string | null;
  onNoteSelect?: (noteId: string | null) => void;
}

const NotesInterface: React.FC<NotesInterfaceProps> = ({ noteId, onNoteSelect }) => {
  const { id: spaceId } = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<string | null>(noteId || null);
  const [notes, setNotes] = useState<ExtendedFile[]>([]);
  const [files, setFiles] = useState<ExtendedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNoteContent, setIsLoadingNoteContent] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [selectedNoteContent, setSelectedNoteContent] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { supabaseUserId, getSupabaseClient } = useSupabaseUser();

  // Update the selected note when the noteId prop changes
  useEffect(() => {
    // Handle both setting and clearing the selected note
    setSelectedNote(noteId || null);
    
    // If a note is selected and notes are loaded, load its content
    if (noteId && notes.length > 0) {
      const noteFile = notes.find(note => note.id === noteId);
      if (noteFile) {
        loadNoteContent(noteFile).then(content => {
          if (content) {
            setSelectedNoteContent(content);
          }
        });
      } else {
        console.log(`Note with ID ${noteId} not found in notes list, waiting for notes to load...`);
      }
    } else if (noteId) {
      console.log(`Notes not loaded yet, will try again after notes load...`);
    }
  }, [noteId, notes]);

  // Initial load of the selected note content when notes are loaded
  useEffect(() => {
    if (selectedNote && notes.length > 0 && !isLoading) {
      const noteFile = notes.find(note => note.id === selectedNote);
      if (noteFile) {
        loadNoteContent(noteFile);
      }
    }
  }, [selectedNote, notes, isLoading]);

  // Extract title from metadata or filename
  const getNoteTitleFromMetadata = (note?: SpaceFile): string => {
    if (!note) return 'Loading...';
    if (note.metadata && note.metadata.title) {
      return note.metadata.title;
    }
    return note.file_name.replace(/\.json$/, '').replace(/_/g, ' ').replace(/Note-/i, '');
  };

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch notes when component mounts
  useEffect(() => {
    fetchNotes();
    fetchFiles();
  }, [spaceId]);

  // Fetch notes for the current space
  const fetchNotes = async () => {
    if (!spaceId) return;
    
    setIsLoading(true);
    try {
      console.log("Fetching notes for NotesInterface, spaceId:", spaceId);
      const { success, data } = await getSpaceFiles(spaceId);
      console.log("Notes response in NotesInterface:", { success, data });
      if (success && data) {
        // Filter notes on the client side
        const notesOnly = data.filter(file => file.is_note);
        // Convert to ExtendedFile with visibility property
        const extendedNotes = notesOnly.map(note => ({
          ...note,
          visible: true // Default all notes to visible
        }));
        setNotes(extendedNotes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch files for the current space (for related files selection)
  const fetchFiles = async () => {
    if (!spaceId) return;
    
    try {
      const { success, data } = await getSpaceFiles(spaceId);
      if (success && data) {
        // Filter out notes, we only want regular files
        const filesOnly = data.filter(file => !file.is_note);
        // Convert to ExtendedFile with visibility property
        const extendedFiles = filesOnly.map(file => ({
          ...file,
          visible: true
        }));
        setFiles(extendedFiles);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  // Helper method to load note content
  const loadNoteContent = async (noteFile: SpaceFile): Promise<string | null> => {
    if (!noteFile || !noteFile.file_path) {
      console.error('Invalid note file or file path');
      return null;
    }

    setIsLoadingNoteContent(true);
    try {
      const supabaseClient = await getSupabaseClient();
      const { data, error } = await supabaseClient.storage
        .from('Vox')
        .download(noteFile.file_path);

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from storage');
      }

      // Read the file content as text
      const content = await data.text();
      setSelectedNoteContent(content);
      return content;
    } catch (error) {
      console.error('Error loading note content:', error);
      toast.error('Failed to load note content');
      return null;
    } finally {
      setIsLoadingNoteContent(false);
    }
  };

  // Save note content to Supabase storage
  const saveNoteContent = async (content: string, noteFile: SpaceFile) => {
    if (!noteFile || !noteFile.file_path) {
      console.error('Invalid note file or file path');
      return false;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const supabaseClient = await getSupabaseClient();
      const contentBlob = new Blob([content], { type: 'application/json' });
      
      const { error } = await supabaseClient.storage
        .from('Vox')
        .update(noteFile.file_path, contentBlob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error saving note content:', error);
      setSaveError('Failed to save note');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNoteClick = async (noteId: string) => {
    setSelectedNote(noteId);
    
    // Notify parent component about the note selection
    if (onNoteSelect) {
      onNoteSelect(noteId);
    }
    
    // Find the note in our list
    const noteFile = notes.find(note => note.id === noteId);
    if (noteFile) {
      await loadNoteContent(noteFile);
    }
  };

  const handleCloseEditor = () => {
    setSelectedNote(null);
    
    // Notify parent component about closing the note
    if (onNoteSelect) {
      onNoteSelect(null);
    }
  };

  const handleSaveNote = async (content: string) => {
    if (!selectedNote) return;
    
    const note = notes.find(n => n.id === selectedNote);
    if (note) {
      await saveNoteContent(content, note);
    }
  };

  // Handle note deletion
  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent note click when delete button is clicked
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }
    
    // Mark note as deleting in UI
    setNotes(prev => 
      prev.map(note => 
        note.id === noteId ? { ...note, isDeletingFile: true } : note
      )
    );
    
    try {
      const { success } = await deleteFile(noteId);
      if (success) {
        // Remove note from list
        setNotes(prev => prev.filter(note => note.id !== noteId));
        toast.success("Note deleted successfully");
      } else {
        // Reset deleting state if failed
        setNotes(prev => 
          prev.map(note => 
            note.id === noteId ? { ...note, isDeletingFile: false } : note
          )
        );
        toast.error("Failed to delete note");
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error("Error deleting note");
      // Reset deleting state
      setNotes(prev => 
        prev.map(note => 
          note.id === noteId ? { ...note, isDeletingFile: false } : note
        )
      );
    }
  };

  // Create a new note with metadata
  const handleCreateNoteWithMetadata = async (title: string, description: string, relatedFiles: string[]) => {
    if (!spaceId || !supabaseUserId) {
      toast.error("Missing required information to create note");
      return;
    }
    
    // Prevent multiple simultaneous note creations
    if (isCreatingNote) {
      console.log("Note creation already in progress, skipping duplicate request");
      return;
    }
    
    // Set flag to indicate we're creating a note
    setIsCreatingNote(true);
    
    try {
      // Create a unique note name
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:.]/g, "-");
      const newNoteName = `Note_${timestamp}`;
      
      // Create a blank JSON structure for the note
      const initialContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Start writing here..."
              }
            ]
          }
        ]
      };
      
      // Create file
      const contentString = JSON.stringify(initialContent);
      const contentBlob = new Blob([contentString], {
        type: "application/json",
      });
      
      // Create a file object directly without using the constructor
      const fileName = `${newNoteName}.json`;
      const fileType = "application/json";
      const file = new Blob([contentString], { type: fileType }) as any;
      file.name = fileName;
      file.lastModified = new Date().getTime();
      
      // Prepare metadata
      const metadata = {
        title,
        description,
        relatedFiles,
        created: new Date().toISOString()
      };
      
      // Get the Supabase client
      const supabaseClient = await getSupabaseClient();
      
      // Upload the file to storage
      const filePath = `${supabaseUserId}/${spaceId}/${Date.now()}_${fileName}`;
      const { error: uploadError } = await supabaseClient.storage
        .from("Vox")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });
      
      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }
      
      // Create a record in the space_files table with metadata
      const fileData = {
        space_id: spaceId,
        user_id: supabaseUserId,
        file_name: fileName,
        file_path: filePath,
        file_type: fileType,
        file_size: contentBlob.size,
        is_note: true,
        metadata
      };
      
      const { data: fileRecord, error: dbError } = await supabaseClient
        .from("space_files")
        .insert([fileData])
        .select()
        .single();
      
      if (dbError) {
        console.error("Database insert error:", dbError);
        throw dbError;
      }
      
      if (fileRecord) {
        // Add the new note to the notes list
        const newNoteFile = fileRecord;
        setNotes(prev => [
          {
            ...newNoteFile,
            visible: true,
            isProcessing: false
          },
          ...prev
        ]);
        
        // Show success toast
        toast.success("New note created successfully");
        
        // Close the modal
        setIsModalOpen(false);
        
        // Open the note editor
        setSelectedNote(newNoteFile.id);
        setSelectedNoteContent(contentString);
        
        console.log("Note created successfully");
      } else {
        console.error("Note creation failed: No file record returned");
        toast.error("Failed to create note");
      }
    } catch (error) {
      console.error('Error creating new note:', error);
      toast.error("Error creating new note");
    } finally {
      // Reset the flag when done
      setIsCreatingNote(false);
    }
  };

  // Simple createNewNote function that opens the modal
  const createNewNote = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col w-full h-full">
      {!selectedNote ? (
        <NoteList
          notes={notes}
          isLoading={isLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onNoteClick={handleNoteClick}
          onDeleteNote={handleDeleteNote}
          onCreateNote={createNewNote}
          isCreatingNote={isCreatingNote}
        />
      ) : (
        <>
          {/* Show loading indicator while loading note content */}
          {isLoadingNoteContent && (
            <div className="flex items-center justify-center h-full w-full bg-white dark:bg-gray-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading note...</p>
              </div>
            </div>
          )}
          {(!isLoadingNoteContent || selectedNoteContent) && (
            <NoteEditor
              onClose={handleCloseEditor}
              noteId={selectedNote}
              noteContent={selectedNoteContent}
              onSave={handleSaveNote}
              noteName={selectedNote ? getNoteTitleFromMetadata(notes.find(n => n.id === selectedNote)) : 'Note'}
            />
          )}
        </>
      )}
      
      {/* Note Creation Modal */}
      <NoteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateNote={handleCreateNoteWithMetadata}
        isCreating={isCreatingNote}
        availableFiles={files}
      />
    </div>
  );
};

export default NotesInterface; 