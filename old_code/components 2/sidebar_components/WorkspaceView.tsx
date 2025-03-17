import React, { useState, useEffect } from "react";
import { WorkspaceViewProps } from "./SidebarTypes";
import WorkspaceItem from "./WorkspaceItem";
import {
  getUserWorkspacesHierarchy,
  getUnorganizedSpaces,
  createWorkspace,
  deleteWorkspace,
  isParentWorkspace,
} from "../../services/workspaceService";
import type { Workspace, Space } from "../../types/space";

const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  userId,
  isMobile,
  isCollapsed,
  selectedWorkspaceId,
  onSelectWorkspace,
  onWorkspacesUpdated,
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [_unorganizedSpaces, setUnorganizedSpaces] = useState<Space[]>(
    [],
  );
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [parentWorkspaceId, setParentWorkspaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{
    id: string;
    isParent: boolean;
  } | null>(null);
  const [_allWorkspacesList, setAllWorkspacesList] = useState<Workspace[]>([]);

  useEffect(() => {
    if (!userId) return;

    async function loadData() {
      setIsLoading(true);
      try {
        // Load workspace hierarchy
        const workspacesResult = await getUserWorkspacesHierarchy(userId);
        if (workspacesResult.success && workspacesResult.data) {
          setWorkspaces(workspacesResult.data);

          // Create a flat list of all workspaces for collapsed view
          const flatList: Workspace[] = [];
          const flattenWorkspaces = (workspaceList: Workspace[]) => {
            workspaceList.forEach((workspace) => {
              flatList.push(workspace);
              if (workspace.children && workspace.children.length > 0) {
                flattenWorkspaces(workspace.children);
              }
            });
          };

          flattenWorkspaces(workspacesResult.data);
          setAllWorkspacesList(flatList);

          // Initially expand first level workspaces for better UX
          const initialExpanded = new Set<string>();
          workspacesResult.data.forEach((workspace) => {
            initialExpanded.add(workspace.id);
          });
          setExpandedWorkspaces(initialExpanded);
        }

        // Load unorganized spaces
        const unorganizedResult = await getUnorganizedSpaces(userId);
        if (unorganizedResult.success && unorganizedResult.data) {
          setUnorganizedSpaces(unorganizedResult.data);
        }
      } catch (err) {
        console.error("Error loading sidebar data:", err);
        setError("Failed to load workspaces");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [userId]);

  const handleToggleWorkspace = (workspaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedWorkspaces((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(workspaceId)) {
        newSet.delete(workspaceId);
      } else {
        newSet.add(workspaceId);
      }
      return newSet;
    });
  };

  const handleSelectWorkspace = (workspaceId: string | null) => {
    onSelectWorkspace(workspaceId);
  };

  const handleCreateNewWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      const result = await createWorkspace(
        userId,
        newWorkspaceName.trim(),
        undefined,
        parentWorkspaceId || undefined,
      );

      if (result.success && result.data) {
        // Refresh workspace list
        const workspacesResult = await getUserWorkspacesHierarchy(userId);
        if (workspacesResult.success && workspacesResult.data) {
          setWorkspaces(workspacesResult.data);

          // Update flat list for collapsed view
          const flatList: Workspace[] = [];
          const flattenWorkspaces = (workspaceList: Workspace[]) => {
            workspaceList.forEach((workspace) => {
              flatList.push(workspace);
              if (workspace.children && workspace.children.length > 0) {
                flattenWorkspaces(workspace.children);
              }
            });
          };

          flattenWorkspaces(workspacesResult.data);
          setAllWorkspacesList(flatList);

          // Expand the parent workspace if this was a subworkspace
          if (parentWorkspaceId) {
            setExpandedWorkspaces((prev) => {
              const newSet = new Set(prev);
              newSet.add(parentWorkspaceId);
              return newSet;
            });
          }
        }

        // Reset form
        setNewWorkspaceName("");
        setIsCreatingWorkspace(false);
        setParentWorkspaceId(null);
        setError(null);

        // Notify parent component that workspaces have been updated
        if (onWorkspacesUpdated) {
          onWorkspacesUpdated();
        }
      } else {
        setError("Failed to create workspace");
      }
    } catch (err) {
      console.error("Error creating workspace:", err);
      setError("An error occurred while creating the workspace");
    }
  };

  const handleAddSubworkspace = (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setParentWorkspaceId(parentId);
    setIsCreatingWorkspace(true);
  };

  const handleDeleteClick = async (workspaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if this is a parent workspace
    const isParent = await isParentWorkspace(workspaceId);

    // Set the workspace to delete with its parent status
    setWorkspaceToDelete({ id: workspaceId, isParent });
  };

  const confirmDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    try {
      const result = await deleteWorkspace(workspaceToDelete.id);

      if (result.success) {
        // If the deleted workspace was selected, reset selection
        if (selectedWorkspaceId === workspaceToDelete.id) {
          onSelectWorkspace(null);
        }

        // Refresh workspace list
        const workspacesResult = await getUserWorkspacesHierarchy(userId);
        if (workspacesResult.success && workspacesResult.data) {
          setWorkspaces(workspacesResult.data);

          // Update flat list for collapsed view
          const flatList: Workspace[] = [];
          const flattenWorkspaces = (workspaceList: Workspace[]) => {
            workspaceList.forEach((workspace) => {
              flatList.push(workspace);
              if (workspace.children && workspace.children.length > 0) {
                flattenWorkspaces(workspace.children);
              }
            });
          };

          flattenWorkspaces(workspacesResult.data);
          setAllWorkspacesList(flatList);
        }

        // Reset state
        setWorkspaceToDelete(null);

        // Notify parent component that workspaces have been updated
        if (onWorkspacesUpdated) {
          onWorkspacesUpdated();
        }
      } else {
        setError("Failed to delete workspace");
      }
    } catch (err) {
      console.error("Error deleting workspace:", err);
      setError("An error occurred while deleting the workspace");
    }
  };

  const cancelDeleteWorkspace = () => {
    setWorkspaceToDelete(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : (
        <>
          {error && !isCollapsed && (
            <div className="text-red-500 text-sm p-2 mb-2">{error}</div>
          )}

          {/* Delete workspace confirmation modal */}
          {workspaceToDelete && !isCollapsed && (
            <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-50">
              <div
                className={`bg-card rounded-lg p-6 ${isMobile ? "w-[90%]" : "max-w-sm"} mx-auto shadow-xl transition-all duration-300 ease-in-out animate-fadeIn`}
              >
                <h3 className="text-lg font-medium text-adaptive mb-4">
                  Confirm Deletion
                </h3>
                <p className="text-muted mb-6">
                  {workspaceToDelete.isParent
                    ? "This workspace contains subworkspaces and/or spaces. Deleting it will also delete all its contents. Are you sure you want to continue?"
                    : "Are you sure you want to delete this workspace?"}
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelDeleteWorkspace}
                    className="px-4 py-2 text-sm font-medium text-adaptive bg-hover hover:bg-active dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md cursor-pointer transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteWorkspace}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md cursor-pointer transition-all duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {isCollapsed ? null : ( // We don't need to render anything in collapsed state since we now use the floating menu
            // Render expanded view with hierarchy
            <>
              {/* All Spaces (unfiltered) option */}
              <div
                className={`flex items-center py-1.5 px-3 my-1.5 rounded-md cursor-pointer transition-all duration-200 ${
                  selectedWorkspaceId === null
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-hover"
                }`}
                onClick={() => handleSelectWorkspace(null)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 transition-colors duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span>All Spaces</span>
              </div>

              {/* Unorganized spaces */}
              <div
                className={`flex items-center py-1.5 px-3 my-1.5 rounded-md cursor-pointer transition-all duration-200 ${
                  selectedWorkspaceId === "unorganized"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-hover"
                }`}
                onClick={() => handleSelectWorkspace("unorganized")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 transition-colors duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                <span>Unorganized</span>
              </div>

              {/* Workspace list */}
              <div className="mt-2">
                {workspaces.map((workspace) => (
                  <WorkspaceItem
                    key={workspace.id}
                    workspace={workspace}
                    depth={0}
                    isCollapsed={isCollapsed}
                    isMobile={isMobile}
                    isSelected={selectedWorkspaceId === workspace.id}
                    expandedWorkspaces={expandedWorkspaces}
                    handleToggleWorkspace={handleToggleWorkspace}
                    handleSelectWorkspace={handleSelectWorkspace}
                    handleAddSubworkspace={handleAddSubworkspace}
                    handleDeleteClick={handleDeleteClick}
                  />
                ))}
              </div>

              {/* Create new workspace button */}
              {!isCreatingWorkspace && (
                <button
                  onClick={() => {
                    setIsCreatingWorkspace(true);
                    setParentWorkspaceId(null);
                  }}
                  className="flex items-center w-full py-2 px-3 mt-3 text-sm text-adaptive dark:text-gray-400 hover:bg-hover rounded-md cursor-pointer transition-all duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2 transition-transform duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New Workspace
                </button>
              )}

              {/* Create workspace modal */}
              {isCreatingWorkspace && (
                <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-50">
                  <div
                    className={`bg-card rounded-lg p-6 ${isMobile ? "w-[90%]" : "max-w-sm"} mx-auto shadow-xl transition-all duration-300 ease-in-out animate-fadeIn`}
                  >
                    <h3 className="text-lg font-medium text-adaptive mb-4">
                      Create New Workspace
                    </h3>
                    <form onSubmit={handleCreateNewWorkspace}>
                      <div className="mb-4">
                        <label
                          htmlFor="workspaceName"
                          className="block text-sm font-medium text-muted mb-2"
                        >
                          Workspace Name
                        </label>
                        <input
                          type="text"
                          id="workspaceName"
                          value={newWorkspaceName}
                          onChange={(e) => setNewWorkspaceName(e.target.value)}
                          className="w-full text-sm px-3 py-2 border border-none rounded-md bg-input text-adaptive focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all duration-200"
                          placeholder="Enter workspace name"
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingWorkspace(false);
                            setNewWorkspaceName("");
                            setParentWorkspaceId(null);
                          }}
                          className="px-4 py-2 text-sm font-medium text-adaptive bg-hover hover:bg-active dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md cursor-pointer transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 cursor-pointer transition-all duration-200"
                        >
                          Create
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default WorkspaceView;
