import React from "react";
import { SpaceViewProps } from "./SidebarTypes";
import FilesTabContent from "./FilesTabContent";
import ChatsTabContent from "./ChatsTabContent";

const SpaceView: React.FC<SpaceViewProps> = ({
  isMobile,
  isCollapsed,
  activeTab,
  setActiveTab,
  files,
  chatSessions,
  isLoadingFiles,
  currentChatSession,
  handleCreateSession,
  handleDeleteFile,
  handleEditChatTitle,
  confirmDeleteSession,
  setCurrentChatSession,
  handleFileUpload,
  uploadingFiles,
  checkedFiles,
  toggleFileChecked,
}) => {
  // State for checked files



  return (
    <>
      {!isCollapsed && (
        <>
          {/* Tabs for Files and Chat History */}
          <div className="flex border-b border-none">
            <button
              onClick={() => setActiveTab?.("files")}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === "files"
                  ? "text-adaptive border-b-2 border-black dark:border-white"
                  : "text-muted hover:text-adaptive"
              } cursor-pointer`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab?.("chats")}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === "chats"
                  ? "text-adaptive border-b-2 border-black dark:border-white"
                  : "text-muted hover:text-adaptive"
              } cursor-pointer`}
            >
              Chats
            </button>
          </div>

          {/* Files Tab Content */}
          {activeTab === "files" && (
            <FilesTabContent
              files={files}
              isLoadingFiles={isLoadingFiles}
              isMobile={isMobile}
              checkedFiles={checkedFiles}
              toggleFileChecked={toggleFileChecked}
              handleDeleteFile={handleDeleteFile}
              handleFileUpload={handleFileUpload}
              uploadingFiles={uploadingFiles}
            />
          )}

          {/* Chat History Tab Content */}
          {activeTab === "chats" && (
            <ChatsTabContent
              chatSessions={chatSessions}
              isMobile={isMobile}
              currentChatSession={currentChatSession}
              handleCreateSession={handleCreateSession}
              handleEditChatTitle={handleEditChatTitle}
              confirmDeleteSession={confirmDeleteSession}
              setCurrentChatSession={setCurrentChatSession}
            />
          )}
        </>
      )}
    </>
  );
};

export default SpaceView;
