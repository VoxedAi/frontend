import React, { useState, useRef } from 'react';
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
  Sun,
  Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { UserButton } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import type { SpaceFile } from '../types/space';

// Extended file type with visibility state
interface ExtendedFile extends SpaceFile {
  visible: boolean;
  isProcessing?: boolean;
  isDeletingFile?: boolean;
}

interface SidebarProps {
  spaceName: string;
  files: ExtendedFile[];
  notes: ExtendedFile[];
  isLoadingFiles: boolean;
  isLoadingNotes: boolean;
  uploadingFiles: Set<string>;
  isCreatingNote: boolean;
  selectedNote: string | null;
  noteSearch: string;
  setNoteSearch: (search: string) => void;
  setSelectedNote: (id: string | null) => void;
  toggleFileVisibility: (id: string) => void;
  handleDeleteFile: (id: string) => void;
  handleDeleteNote: (id: string) => void;
  createNewNote: () => void;
  handleNewFile: (type: string) => void;
  setShowChat: (show: boolean) => void;
  setShowNote: (show: boolean) => void;
  setShowSandbox: (show: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openNote?: (noteId: string) => void;
  showNotesList?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  spaceName,
  files,
  notes,
  isLoadingFiles,
  isLoadingNotes,
  uploadingFiles,
  isCreatingNote,
  selectedNote,
  noteSearch,
  setNoteSearch,
  setSelectedNote,
  toggleFileVisibility,
  handleDeleteFile,
  handleDeleteNote,
  createNewNote,
  handleNewFile,
  setShowChat,
  setShowNote,
  setShowSandbox,
  fileInputRef,
  handleFileUpload,
  openNote,
  showNotesList
}) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [filesExpanded, setFilesExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(true);
  const [showNewFileMenu, setShowNewFileMenu] = useState(false);

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

  // Get display name for a file, using metadata.title if available
  const getDisplayName = (file: ExtendedFile) => {
    if (file.metadata && typeof file.metadata === 'object' && 'title' in file.metadata) {
      return file.metadata.title as string;
    }
    return file.file_name.replace(/\.json$/, '');
  };

  // Filter notes based on search term - search in both title and filename
  const filteredNotes = notes.filter(note => {
    const displayName = getDisplayName(note).toLowerCase();
    const fileName = note.file_name.toLowerCase();
    return displayName.includes(noteSearch.toLowerCase()) || 
           fileName.includes(noteSearch.toLowerCase());
  });

  return (
    <div className="w-60 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out">
      {/* Header - with space for the toggle button */}
      <div className="p-3 pl-16 flex items-center gap-2">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center text-xs font-bold">
            👨
          </div>
          <span className="ml-2 font-medium text-adaptive">{spaceName}</span>
        </div>
      </div>

      {/* Search */}
      <div className="mx-4 my-2">
        <button 
          onClick={() => {
            setShowChat(true);
            setShowNote(false);
            setShowSandbox(false);
          }} 
          className="w-full rounded-md px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <a className="text-gray-400 text-sm">Ask Vox</a>
        </button>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

      {/* Main Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Notes Section */}
        <div className="my-2">
          <div 
            className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <div 
              className="flex items-center flex-1"
              onClick={() => {
                if (showNotesList) {
                  // Use the dedicated function to show notes list
                  showNotesList();
                } else if (openNote) {
                  // Clear the selected note but show notes view
                  setSelectedNote(null);
                  setShowNote(true);
                } else {
                  setShowNote(true);
                  setShowChat(false);
                  setShowSandbox(false);
                }
              }}
            >
              <FileText size={16} className="text-gray-500 mr-2" />
              <span className="text-sm text-adaptive">Notes</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">{notes.length}</span>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setNotesExpanded(!notesExpanded);
                }}
                className="cursor-pointer p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                {notesExpanded ? 
                  <ChevronDown size={16} className="text-gray-500" /> : 
                  <ChevronRight size={16} className="text-gray-500" />
                }
              </div>
            </div>
          </div>
          
          {/* Notes List - only visible when expanded */}
          {notesExpanded && (
            <div className="ml-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-md mx-2">
              {/* Notes search */}
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-adaptive"
                />
              </div>
              
              {/* Loading state */}
              {isLoadingNotes ? (
                <div className="flex justify-center py-4">
                  <Loader size={16} className="animate-spin text-gray-500" />
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-2">
                  {noteSearch ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No notes matching "{noteSearch}"
                    </p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No notes created yet
                    </p>
                  )}
                </div>
              ) : (
                // Notes list
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {filteredNotes.map((note) => (
                    <div 
                      key={note.id} 
                      className={`flex items-center justify-between py-1 px-2 text-sm rounded cursor-pointer ${
                        selectedNote === note.id 
                          ? 'bg-blue-100 dark:bg-blue-900' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        if (openNote) {
                          openNote(note.id);
                        } else {
                          setSelectedNote(note.id);
                          setShowNote(true);
                          setShowChat(false);
                          setShowSandbox(false);
                        }
                      }}
                    >
                      <div className="flex items-center overflow-hidden">
                        {note.metadata?.emoji ? (
                          <span className="mr-2 flex-shrink-0">{note.metadata.emoji}</span>
                        ) : (
                          <FileText size={14} className="text-gray-500 mr-2 flex-shrink-0" />
                        )}
                        <span className="truncate text-adaptive">
                          {getDisplayName(note)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        {note.isDeletingFile ? (
                          <Loader size={14} className="animate-spin text-gray-500 mr-2" />
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mr-2"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Create new note button */}
                  <div 
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mt-2 w-full cursor-pointer py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    onClick={() => {
                      createNewNote();
                    }}
                  >
                    {isCreatingNote ? (
                      <>
                        <Loader size={14} className="animate-spin mr-1" />
                        <span>Creating note...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} className="mr-1" />
                        <span>New note</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Code Section */}
        <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          onClick={() => {
            setShowSandbox(true);
            setShowNote(false);
            setShowChat(false);
          }}
        >
          <div className="flex items-center">
            <Code size={16} className="text-gray-500 mr-2" />
            <span className="text-sm text-adaptive">Code</span>
          </div>
          <span className="text-xs text-gray-500">1</span>
        </div>
        
        {/* Files Section */}
        <div className="my-2">
          <div 
            className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            onClick={() => setFilesExpanded(!filesExpanded)}
          >
            <div className="flex items-center">
              <Folder size={16} className="text-gray-500 mr-2" />
              <span className="text-sm text-adaptive">Files</span>
            </div>
            {filesExpanded ? 
              <ChevronDown size={16} className="text-gray-500" /> : 
              <ChevronRight size={16} className="text-gray-500" />
            }
          </div>
          
          {/* Files List - only visible when expanded */}
          {filesExpanded && (
            <div className="ml-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-md mx-2">
              {/* File upload input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploadingFiles.size > 0}
              />
              
              {/* Loading state */}
              {isLoadingFiles ? (
                <div className="flex justify-center py-4">
                  <Loader size={16} className="animate-spin text-gray-500" />
                </div>
              ) : files.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-2">
                  No files uploaded yet
                </p>
              ) : (
                // Files list
                files.map((file) => (
                  <div 
                    key={file.id} 
                    className="flex items-center justify-between py-1 px-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <div className="flex items-center overflow-hidden">
                      {file.metadata?.emoji ? (
                        <span className="mr-2 flex-shrink-0">{file.metadata.emoji}</span>
                      ) : (
                        getFileTypeIcon(file.file_type)
                      )}
                      <span className="truncate text-adaptive">{getDisplayName(file)}</span>
                    </div>
                    <div className="flex items-center">
                      {file.isDeletingFile ? (
                        <Loader size={14} className="animate-spin text-gray-500 mr-2" />
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mr-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFileVisibility(file.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {file.visible ? 
                          <Eye size={14} /> : 
                          <EyeOff size={14} />
                        }
                      </button>
                    </div>
                  </div>
                ))
              )}
              
              {/* Add new file button */}
              <label
                htmlFor="file-upload"
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mt-2 w-full cursor-pointer"
              >
                {uploadingFiles.size > 0 ? (
                  <>
                    <Loader size={14} className="animate-spin mr-1" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus size={14} className="mr-1" />
                    Add file
                  </>
                )}
              </label>
            </div>
          )}
        </div>

        {/* Create new button */}
        <div className="relative">
          <div 
            className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setShowNewFileMenu(!showNewFileMenu)}
          >
            <Plus size={16} className="text-gray-400 mr-1" />
            <span className="text-sm text-adaptive">Create new</span>
          </div>
          
          {showNewFileMenu && (
            <div className="absolute left-8 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
              <div 
                className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => handleNewFile('note')}
              >
                <FileText size={16} className="text-gray-500 mr-2" />
                <span className="text-adaptive">New Note</span>
              </div>
              <div 
                className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => handleNewFile('code')}
              >
                <Code size={16} className="text-gray-500 mr-2" />
                <span className="text-adaptive">New Code</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom menu */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-auto">
        <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
          <div className="flex items-center">
            <User size={16} className="text-gray-500 mr-2" />
            <span className="text-sm text-adaptive">Profile</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-yellow-200 flex items-center justify-center text-xs">
            <UserButton />
          </div>
        </div>
        
        <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          onClick={() => {
            toggleTheme();
          }}
        >
          <div className="flex items-center">
            {theme === 'dark' ? (
              <Sun size={16} className="text-gray-500 mr-2" />
            ) : (
              <Moon size={16} className="text-gray-500 mr-2" />
            )}
            <span className="text-sm text-adaptive">Dark mode</span>
          </div>
          {theme === 'dark' ? (
            <Sun size={16} className="text-gray-500" />
          ) : (
            <Moon size={16} className="text-gray-500" />
          )}
        </div>
        
        <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
          <div className="flex items-center">
            <Info size={16} className="text-gray-500 mr-2" />
            <span className="text-sm text-adaptive">About</span>
          </div>
          <Info size={16} className="text-gray-500" />
        </div>
        
        <div 
            className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            onClick={() => {
                navigate('/');
            }}
        >
          <div className="flex items-center">
            <LogOut size={16} className="text-gray-500 mr-2" />
            <span className="text-sm text-adaptive">Leave</span>
          </div>
          <LogOut size={16} className="text-gray-500" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
