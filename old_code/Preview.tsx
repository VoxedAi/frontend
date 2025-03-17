import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import SimplifiedChatInterface from './chat/NewChatInterface';
import NotesInterface from './note/NotesInterface';
import VoxPilot from '../src/components/VoxPilot';
import NewSidebar from './NewSidebar';
import Sandbox from '../src/components/code/Sandbox';

interface PreviewProps {
  spaceId: string;
  space: any;
  files: any[];
  chatSessions: any[];
  currentChatSession: any;
  isLoadingFiles: boolean;
  handleCreateSession: () => void;
  handleDeleteFile: (fileId: string) => void;
  handleEditChatTitle: (sessionId: string, newTitle: string) => void;
  confirmDeleteSession: (sessionId: string) => void;
  setCurrentChatSession: (session: any) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  uploadingFiles: Set<string>;
  toggleNotesPanel: () => void;
  isNotesPanelExpanded: boolean;
  toggleSandbox: () => void;
  isSandboxExpanded: boolean;
  isNoteQuestion: boolean;
  setIsNoteQuestion: (value: boolean) => void;
  isCodingQuestion: boolean;
  setIsCodingQuestion: (value: boolean) => void;
  // Add other props as needed
}

// Define view types for better type safety
type ViewType = 'chat' | 'note' | 'code';

const Preview: React.FC<PreviewProps> = ({
  spaceId,
  space,
  files,
  chatSessions,
  currentChatSession,
  isLoadingFiles,
  handleCreateSession,
  handleDeleteFile,
  handleEditChatTitle,
  confirmDeleteSession,
  setCurrentChatSession,
  handleFileUpload,
  uploadingFiles,
  toggleNotesPanel,
  isNotesPanelExpanded,
  toggleSandbox,
  isSandboxExpanded,
  isNoteQuestion,
  setIsNoteQuestion,
  isCodingQuestion,
  setIsCodingQuestion,
  // Add other props as needed
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showNote, setShowNote] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showVoxPilot, setShowVoxPilot] = useState(true);

  const handleCloseVoxPilot = () => {
    setShowVoxPilot(false);
  };

  const handleOpenVoxPilot = () => {
    setShowVoxPilot(true);
  };

  // Consolidated function to switch between views
  const switchView = (view: ViewType) => {
    // Reset all views
    setShowChat(false);
    setShowNote(false);
    setShowCode(false);
    
    // Show VoxPilot by default when switching views
    setShowVoxPilot(true);
    
    // Set the appropriate view
    switch (view) {
      case 'chat':
        setShowChat(true);
        // Close panels if they're open
        if (isNotesPanelExpanded) toggleNotesPanel();
        if (isSandboxExpanded) toggleSandbox();
        break;
      case 'note':
        setShowNote(true);
        // Ensure notes panel is open
        if (!isNotesPanelExpanded) toggleNotesPanel();
        // Close sandbox if it's open
        if (isSandboxExpanded) toggleSandbox();
        break;
      case 'code':
        setShowCode(true);
        // Ensure sandbox is open
        if (!isSandboxExpanded) toggleSandbox();
        // Close notes panel if it's open
        if (isNotesPanelExpanded) toggleNotesPanel();
        break;
    }
  };

  return (
    <div className="flex relative h-screen">
      {/* Sidebar */}
      <NewSidebar
        userId={space?.user_id || ''}
        isCollapsed={!sidebarOpen}
        onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
        mode="space"
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
        spaceName={space?.name || ''}
        uploadingFiles={uploadingFiles}
        toggleNotesPanel={() => switchView('note')}
        isNotesPanelExpanded={isNotesPanelExpanded}
        toggleSandbox={() => switchView('code')}
        isSandboxExpanded={isSandboxExpanded}
        isNoteQuestion={isNoteQuestion}
        onSelectWorkspace={() => {}}
        selectedWorkspaceId={spaceId}
        // Use the switchView function for the "Chat with Vox" button
        setActiveTab={(tab) => {
          if (tab === "files" || tab === "chats") {
            switchView('chat');
          }
        }}
      />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out`}>
        {showChat && !showNote && !showCode && (
          <SimplifiedChatInterface 
            currentChatSession={currentChatSession}
            chatSessions={chatSessions}
            handleCreateSession={handleCreateSession}
            setCurrentChatSession={setCurrentChatSession}
            handleEditChatTitle={handleEditChatTitle}
            confirmDeleteSession={confirmDeleteSession}
            isCodingQuestion={isCodingQuestion}
            setIsCodingQuestion={setIsCodingQuestion}
            isNoteQuestion={isNoteQuestion}
            setIsNoteQuestion={setIsNoteQuestion}
          />
        )}
        {showNote && !showChat && !showCode && (
          <div className="flex w-full h-full">
            <div className={showVoxPilot ? "w-7/10" : "w-full"}>
              <NotesInterface 
                spaceId={spaceId}
                isExpanded={isNotesPanelExpanded}
                onToggleExpand={toggleNotesPanel}
              />
            </div>
            {showVoxPilot && (
              <div className="w-3/10">
                <VoxPilot 
                  spaceId={spaceId}
                  currentChatSessionId={currentChatSession?.id}
                  onClose={handleCloseVoxPilot}
                />
              </div>
            )}
            {!showVoxPilot && (
              <button
                onClick={handleOpenVoxPilot}
                className="absolute bottom-4 right-4 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-colors"
                aria-label="Open VoxPilot"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12H20M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        )}
        {showCode && !showChat && !showNote && (
          <div className="flex w-full h-full">
            <div className={showVoxPilot ? "w-7/10" : "w-full"}>
              <Sandbox />
            </div>
            {showVoxPilot && (
              <div className="w-3/10">
                <VoxPilot 
                  spaceId={spaceId}
                  currentChatSessionId={currentChatSession?.id}
                  onClose={handleCloseVoxPilot}
                />
              </div>
            )}
            {!showVoxPilot && (
              <button
                onClick={handleOpenVoxPilot}
                className="absolute bottom-4 right-4 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-colors"
                aria-label="Open VoxPilot"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12H20M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Preview; 