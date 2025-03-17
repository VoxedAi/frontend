import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Library, 
  File, 
  FileText,
  Plus, 
  ChevronDown, 
  ChevronRight, 
  User, 
  Moon, 
  Info, 
  LogOut,
  Code,
  Eye,
  EyeOff,
  Folder,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Loader
} from 'lucide-react';
import SimplifiedChatInterface from '../new_components/Chat';
import Note from '../new_components/Note';
import ChatInterface from '../new_components/VoxPilot';
import { useNavigate, useParams } from 'react-router-dom';
import Sandbox from '../new_components/Code';
import { useSupabaseUser } from '../contexts/UserContext';
import { getSpaceFiles, deleteFile, uploadAndProcessFile, processFile } from '../services/fileUpload';
import { getSpace } from '../services/spaceService';
import { useMobile } from '../contexts/MobileContext';
import type { SpaceFile } from '../types/space';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import Sidebar from '../new_components/Sidebar';
import { useLayoutState } from '../hooks';

// Extended file type with visibility state
interface ExtendedFile extends SpaceFile {
  visible: boolean;
  isProcessing?: boolean;
  isDeletingFile?: boolean;
}

const Space = () => {
  const { id: spaceId } = useParams<{ id: string }>();
  const isMobile = useMobile();
  
  // Use the useLayoutState hook to manage UI layout state in the URL
  const [layout, setLayout] = useLayoutState({
    sidebarOpen: !isMobile, 
    filesExpanded: false,
    notesExpanded: true,
    selectedView: 'chat',
    selectedNoteId: null
  });

  // Destructure layout state for easy access
  const { sidebarOpen, filesExpanded, notesExpanded, selectedView, selectedNoteId } = layout;
  
  // Ensure selectedNoteId is always a string or null
  const safeSelectedNoteId: string | null = selectedNoteId || null;
  
  // State that doesn't need to be in the URL
  const [showNewFileMenu, setShowNewFileMenu] = useState(false);
  const [files, setFiles] = useState<ExtendedFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [spaceName, setSpaceName] = useState('Space');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [notes, setNotes] = useState<ExtendedFile[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [noteSearch, setNoteSearch] = useState('');
  const { supabaseUserId, getSupabaseClient, refreshSupabaseToken } =
    useSupabaseUser();
  
  const navigate = useNavigate();

  // Computed state based on selectedView
  const showChat = selectedView === 'chat';
  const showNote = selectedView === 'notes';
  const showSandbox = selectedView === 'code';
  
  // Update state setters to work with the layout state
  const setSidebarOpen = (open: boolean) => setLayout({ sidebarOpen: open });
  const setFilesExpanded = (expanded: boolean) => setLayout({ filesExpanded: expanded });
  const setNotesExpanded = (expanded: boolean) => setLayout({ notesExpanded: expanded });
  const setShowChat = (show: boolean) => show && setLayout({ selectedView: 'chat', selectedNoteId: null });
  const setShowNote = (show: boolean) => show && setLayout({ selectedView: 'notes' });
  const setShowSandbox = (show: boolean) => show && setLayout({ selectedView: 'code', selectedNoteId: null });
  
  // Create a new setter for selectedNoteId
  const setSelectedNote = (noteId: string | null) => {
    setLayout({ 
      selectedNoteId: noteId,
      // If a note is selected, ensure notes view is active
      ...(noteId ? { selectedView: 'notes' } : {})
    });
  };

  // Ensure view mode matches URL state when a note is selected
  useEffect(() => {
    if (selectedNoteId && selectedView !== 'notes') {
      setLayout({ selectedView: 'notes' });
    }
  }, [selectedNoteId, selectedView]);

  // Fetch space details and files when component mounts
  useEffect(() => {
    console.log("Space component mounted with spaceId:", spaceId, "and userId:", supabaseUserId);
    if (spaceId && supabaseUserId) {
      fetchSpaceDetails();
      fetchFiles();
      fetchNotes();
    } else {
      console.log("Missing required parameters:", { spaceId, supabaseUserId });
      setIsLoadingFiles(false);
      setIsLoadingNotes(false);
    }
  }, [spaceId, supabaseUserId]);

  // Fetch space details
  const fetchSpaceDetails = async () => {
    if (!spaceId) return;
    
    try {
      console.log("Fetching space details for spaceId:", spaceId);
      const { success, data } = await getSpace(spaceId);
      console.log("Space details response:", { success, data });
      if (success && data) {
        setSpaceName(data.title);
      }
    } catch (error) {
      console.error('Error fetching space details:', error);
    }
  };

  // Fetch files for the current space
  const fetchFiles = async () => {
    if (!spaceId) return;
    
    setIsLoadingFiles(true);
    try {
      console.log("Fetching files for spaceId:", spaceId);
      const { success, data } = await getSpaceFiles(spaceId);
      console.log("Files response:", { success, data });
      if (success && data) {
        // Convert to ExtendedFile with visibility property
        const extendedFiles = data.map(file => ({
          ...file,
          visible: true // Default all files to visible
        }));
        setFiles(extendedFiles);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Fetch notes for the current space
  const fetchNotes = async () => {
    if (!spaceId) return;
    
    setIsLoadingNotes(true);
    try {
      console.log("Fetching notes for spaceId:", spaceId);
      // Filter notes by is_note flag in the query
      const { success, data } = await getSpaceFiles(spaceId);
      console.log("Notes response:", { success, data });
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
      setIsLoadingNotes(false);
    }
  };

  // Toggle file visibility
  const toggleFileVisibility = (id: string) => {
    setFiles(files.map(file => 
      file.id === id ? { ...file, visible: !file.visible } : file
    ));
  };

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current += 1;
    
    // Only set dragging to true if there are files
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ensure the dragging state stays true during drag over
    if (!isDragging && e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current -= 1;
    
    // Only set dragging to false when counter reaches 0
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
    
    if (!e.dataTransfer.files || !e.dataTransfer.files.length || !spaceId || !supabaseUserId) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Process each dropped file
    for (const file of droppedFiles) {
      try {
        // Create a temporary ID to track the uploading state
        const tempId = `temp-${Date.now()}-${file.name}`;
        
        // Add to uploading set
        setUploadingFiles(prev => new Set(prev).add(tempId));
        
        const result = await uploadAndProcessFile(
          file,
          spaceId,
          supabaseUserId,
          async () => {
            // Simple no-op refresh token function
            console.log("Token refresh requested but not implemented in this component");
          },
          async () => {
            // Simple function that returns the default supabase client
            console.log("Getting supabase client");
            return supabase;
          },
          false // isNote
        );
        
        // Remove from uploading set
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(tempId);
          return newSet;
        });
        
        if (result.success && result.data) {
          // Add the new file to the files list
          setFiles(prev => [
            {
              ...result.data,
              visible: true,
              isProcessing: Boolean(result.isProcessing)
            },
            ...prev
          ]);
          
          console.log("File uploaded successfully:", result.message);
        } else {
          console.error("File upload failed:", result.error);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  }, [spaceId, supabaseUserId]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !spaceId || !supabaseUserId) return;
    
    const file = e.target.files[0];
    
    try {
      // Create a temporary ID to track the uploading state
      const tempId = `temp-${Date.now()}`;
      
      // Add to uploading set
      setUploadingFiles(prev => new Set(prev).add(tempId));
      
      const result = await uploadAndProcessFile(
        file,
        spaceId,
        supabaseUserId,
        async () => {
          // Simple no-op refresh token function
          console.log("Token refresh requested but not implemented in this component");
        },
        async () => {
          // Simple function that returns the default supabase client
          console.log("Getting supabase client");
          return supabase;
        },
        false // isNote
      );
      
      // Remove from uploading set using the tempId from the result
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
      
      if (result.success && result.data) {
        // Add the new file to the files list
        setFiles(prev => [
          {
            ...result.data,
            visible: true,
            isProcessing: Boolean(result.isProcessing)
          },
          ...prev
        ]);
        
        console.log("File uploaded successfully:", result.message);
      } else {
        console.error("File upload failed:", result.error);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (fileId: string) => {
    // Mark file as deleting
    setFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, isDeletingFile: true } : file
      )
    );
    
    try {
      const { success } = await deleteFile(fileId);
      if (success) {
        // Remove file from list
        setFiles(prev => prev.filter(file => file.id !== fileId));
      } else {
        // Reset deleting state if failed
        setFiles(prev => 
          prev.map(file => 
            file.id === fileId ? { ...file, isDeletingFile: false } : file
          )
        );
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Reset deleting state
      setFiles(prev => 
        prev.map(file => 
          file.id === fileId ? { ...file, isDeletingFile: false } : file
        )
      );
    }
  };

  // Get file type icon
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('image')) {
      return <File size={14} className="text-gray-500 mr-2 flex-shrink-0" />;
    } else if (fileType.includes('text') || fileType.includes('document') || fileType.includes('pdf')) {
      return <FileText size={14} className="text-gray-500 mr-2 flex-shrink-0" />;
    } else if (fileType.includes('javascript') || fileType.includes('code') || fileType.includes('json') || fileType.includes('html') || fileType.includes('css')) {
      return <Code size={14} className="text-gray-500 mr-2 flex-shrink-0" />;
    } else {
      return <File size={14} className="text-gray-500 mr-2 flex-shrink-0" />;
    }
  };

  // Format file size
  const getFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} bytes`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  };

  // Create a new note
  const createNewNote = async () => {
    if (!spaceId || !supabaseUserId) return;
    
    // Prevent multiple simultaneous note creations
    if (isCreatingNote) {
      console.log("Note creation already in progress, skipping duplicate request");
      return;
    }
    
    // Set flag to indicate we're creating a note
    setIsCreatingNote(true);
    
    try {
      // Create a unique note name
      const newNoteName = `Note_${new Date().toISOString().slice(0, 19).replace(/[T:.]/g, "-")}`;
      
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
      
      // Get an authenticated Supabase client
      const authClient = await getSupabaseClient();
      
      // Format the storage path correctly for our bucket policies
      const filePath = `${supabaseUserId}/${spaceId}/${Date.now()}_${fileName}`;
      
      console.log("Uploading note to path:", filePath);
      
      // Upload the file to Supabase storage directly
      const { error: uploadError } = await authClient.storage
        .from("Vox")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });
      
      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }
      
      // Get the public URL for the file
      const { data: publicUrlData } = authClient.storage
        .from("Vox")
        .getPublicUrl(filePath);
      
      if (!publicUrlData) {
        throw new Error("Failed to get public URL for uploaded file");
      }
      
      console.log("File uploaded successfully, creating database record");
      
      // Create a record in the space_files table
      const fileData = {
        space_id: spaceId,
        user_id: supabaseUserId,
        file_name: fileName,
        file_path: filePath,
        file_type: fileType,
        file_size: contentBlob.size,
        is_note: true,
      };
      
      const { data: fileRecord, error: dbError } = await authClient
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
        
        // Open the notes panel
        setShowNote(true);
        setShowChat(false);
        setShowSandbox(false);
        
        // Process the file to ensure it's handled like other files
        try {
          await processFile(newNoteFile.id);
        } catch (err) {
          console.error("Error processing note:", err);
          toast.error("Error processing note");
        }
        
        console.log("Note created successfully");
        
        // Refresh the notes list to ensure UI is up to date
        fetchNotes();
      }
    } catch (error) {
      console.error('Error creating new note:', error);
      toast.error("Error creating new note");
    } finally {
      // Reset the flag when done
      setIsCreatingNote(false);
      // Close the menu
      setShowNewFileMenu(false);
    }
  };

  // Handle note deletion
  const handleDeleteNote = async (noteId: string) => {
    // Mark note as deleting
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

  const handleNewFile = (type: string) => {
    console.log(`Creating new ${type} file`);
    if (type === 'note') {
      createNewNote();
    } else if (type === 'code') {
      // Handle code creation
      setShowSandbox(true);
      setShowNote(false);
      setShowChat(false);
      setShowNewFileMenu(false);
    }
  };

  // Filter notes based on search term
  const filteredNotes = notes.filter(note => 
    note.file_name.toLowerCase().includes(noteSearch.toLowerCase())
  );

  return (
    <div 
      className="flex relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay - only shown when dragging */}
      {isDragging && (
        <div className="absolute inset-0 bg-gray-900/50 dark:bg-gray-800/70 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            <Folder size={48} className="mx-auto mb-4 text-blue-500" />
            <h3 className="text-xl font-medium text-adaptive mb-2">Drop files to upload</h3>
            <p className="text-gray-500 dark:text-gray-400">Files will be uploaded to this space</p>
          </div>
        </div>
      )}

      {/* Fixed Toggle Button */}
      <div className="absolute top-3 left-3 z-10">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>

      {/* Sidebar - only rendered when open */}
      {sidebarOpen && (
        <Sidebar
          spaceName={spaceName}
          files={files}
          notes={notes}
          isLoadingFiles={isLoadingFiles}
          isLoadingNotes={isLoadingNotes}
          uploadingFiles={uploadingFiles}
          isCreatingNote={isCreatingNote}
          selectedNote={safeSelectedNoteId}
          noteSearch={noteSearch}
          setNoteSearch={setNoteSearch}
          setSelectedNote={setSelectedNote}
          toggleFileVisibility={toggleFileVisibility}
          handleDeleteFile={handleDeleteFile}
          handleDeleteNote={handleDeleteNote}
          createNewNote={createNewNote}
          handleNewFile={handleNewFile}
          setShowChat={setShowChat}
          setShowNote={setShowNote}
          setShowSandbox={setShowSandbox}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out`}>
        {showChat && !showNote && <SimplifiedChatInterface />}
        {showNote && !showChat && (
            <div className="flex w-full h-full bg-white dark:bg-gray-900">
                <div className="w-7/10">
                    <Note 
                      noteId={safeSelectedNoteId} 
                      onNoteSelect={setSelectedNote} 
                    />
                </div>
                <div className="w-3/10">
                    <ChatInterface />
                </div>
            </div>
        )}
        {!showNote && !showChat && showSandbox && (
            <div className="flex w-full h-full bg-white dark:bg-gray-900">
                <div className="w-7/10">
                    <Sandbox />
                </div>
                <div className="w-3/10">
                    <ChatInterface />
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Space;