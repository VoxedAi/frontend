import React, { useState, useEffect } from "react";
import { SidebarProps } from "./sidebar_components/SidebarTypes";
import SidebarHeader from "./sidebar_components/SidebarHeader";
import FolderView from "./sidebar_components/FolderView";
import NotebookView from "./sidebar_components/NotebookView";
import CollapsedSidebar from "./sidebar_components/CollapsedSidebar";
import SidebarOverlay from "./sidebar_components/SidebarOverlay";
import { useMobile } from "../contexts/MobileContext";
import { useToggledFiles } from "../hooks/useToggledFiles";

const Sidebar: React.FC<SidebarProps> = ({
  userId,
  isCollapsed,
  onToggleCollapse,
  selectedFolderId,
  onSelectFolder,
  onFoldersUpdated,
  // Notes panel toggle props
  toggleNotesPanel,
  isNotesPanelExpanded,
  // Sandbox toggle props
  toggleSandbox,
  isSandboxExpanded,
  // Notebook props with defaults
  mode = "folders",
  activeTab = "files",
  setActiveTab,
  files = [],
  chatSessions = [],
  isLoadingFiles = false,
  currentChatSession = null,
  handleCreateSession,
  handleDeleteFile,
  handleEditChatTitle,
  confirmDeleteSession,
  setCurrentChatSession,
  handleFileUpload,
  notebookName = "",
  uploadingFiles = new Set(),
  // Note question mode
  isNoteQuestion = false,
}) => {
  // Add state to track hover on collapsed sidebar
  const [isHoveringCollapsed, setIsHoveringCollapsed] = useState(false);

  // Add keyframe animation styles
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.2s ease-out forwards;
      }
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-slideDown {
        animation: slideDown 0.2s ease-out forwards;
      }
      @keyframes slideUp {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); visibility: hidden; }
      }
      .animate-slideUp {
        animation: slideUp 0.2s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Check if we're on a mobile device
  const isMobile = useMobile("(max-width: 768px)");
  
  // Use our custom hook for toggled files
  const { 
    toggledFiles, 
    isLoading: isLoadingToggledFiles, 
    toggleFile,
    validateFiles
  } = useToggledFiles(userId);

  // State for note toggled files
  const [noteToggledFiles, setNoteToggledFiles] = useState<Set<string>>(new Set());

  // Update note toggled files when files or isNoteQuestion changes
  useEffect(() => {
    if (isNoteQuestion) {
      const noteFiles = files.filter(file => file.is_note);
      setNoteToggledFiles(new Set(noteFiles.map(file => file.id)));
    } else {
      setNoteToggledFiles(new Set());
    }
  }, [isNoteQuestion]);

  // Effect to validate toggled files when files change
  useEffect(() => {
    if (files.length > 0) {
      validateFiles(files.map(file => file.id));
    }
  }, [files, validateFiles]);

  return (
    <div className="relative h-full">
      {/* Collapsed sidebar */}
      {isCollapsed && (
        <CollapsedSidebar
          isMobile={isMobile}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          isHoveringCollapsed={isHoveringCollapsed}
          setIsHoveringCollapsed={setIsHoveringCollapsed}
          mode={mode}
          setActiveTab={setActiveTab}
          handleCreateSession={handleCreateSession}
          handleFileUpload={handleFileUpload}
          handleSelectFolder={onSelectFolder}
          allFoldersList={[]}
          toggleNotesPanel={toggleNotesPanel}
          isNotesPanelExpanded={isNotesPanelExpanded}
          toggleSandbox={toggleSandbox}
          isSandboxExpanded={isSandboxExpanded}
        />
      )}

      {/* Expanded sidebar */}
      <div
        className={`h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-64 opacity-100"
        }`}
      >
        {/* Sidebar Header */}
        <SidebarHeader
          mode={mode}
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          onToggleCollapse={onToggleCollapse}
          notebookName={notebookName}
          toggleNotesPanel={toggleNotesPanel}
          isNotesPanelExpanded={isNotesPanelExpanded}
          toggleSandbox={toggleSandbox}
          isSandboxExpanded={isSandboxExpanded}
        />

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          {mode === "folders" ? (
            // Folder Navigation Content
            <FolderView
              userId={userId}
              isMobile={isMobile}
              isCollapsed={isCollapsed}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onFoldersUpdated={onFoldersUpdated}
            />
          ) : (
            // Notebook Mode Content
            <NotebookView
              userId={userId}
              isMobile={isMobile}
              isCollapsed={isCollapsed}
              notebookName={notebookName}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              files={files}
              chatSessions={chatSessions}
              isLoadingFiles={isLoadingFiles}
              currentChatSession={currentChatSession}
              handleCreateSession={handleCreateSession}
              handleDeleteFile={handleDeleteFile}
              handleEditChatTitle={handleEditChatTitle}
              confirmDeleteSession={confirmDeleteSession}
              setCurrentChatSession={setCurrentChatSession}
              handleFileUpload={handleFileUpload}
              uploadingFiles={uploadingFiles}
              checkedFiles={isNoteQuestion ? noteToggledFiles : toggledFiles}
              toggleFileChecked={(fileId, e) => {
                e.stopPropagation();
                // If in note question mode, don't allow toggling files
                if (!isNoteQuestion) {
                  toggleFile(fileId);
                }
              }}
              isNoteQuestion={isNoteQuestion}
            />
          )}
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      <SidebarOverlay 
        isMobile={isMobile}
        isCollapsed={isCollapsed} 
        onToggleCollapse={onToggleCollapse} 
      />
    </div>
  );
};

export default Sidebar;
