import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSupabaseUser } from "../../contexts/UserContext";
import {
  getUserSpaces,
  createSpaceWithWorkspace,
  updateSpaceWithWorkspace,
} from "../../services/spaceService";
import {
  getSpacesInWorkspace,
  getSpacesInWorkspaceRecursive,
  getUnorganizedSpaces,
  getUserWorkspacesHierarchy,
  isParentWorkspace,
} from "../../services/workspaceService";
import type { Space, Workspace } from "../../types/space";
import Sidebar from "../../components/Sidebar";
import SpaceModal from "../../components/SpaceModal";
import { useMobile } from "../../contexts/MobileContext";

export default function SpacesPage() {
  const navigate = useNavigate();
  const { supabaseUserId, isLoading: isUserLoading } = useSupabaseUser();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [includeNestedSpaces, setIncludeNestedSpaces] = useState(false);

  const isMobile = useMobile("(max-width: 768px)");

  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  }, [isMobile]);

  // Function to refresh workspaces
  const refreshWorkspaces = async () => {
    if (!supabaseUserId) return;

    try {
      const result = await getUserWorkspacesHierarchy(supabaseUserId);
      if (result.success && result.data) {
        setWorkspaces(result.data);
      }
    } catch (err) {
      console.error("Error refreshing workspaces:", err);
    }
  };

  // Get current workspace ID for the space being edited
  const getCurrentWorkspaceId = (spaceId: string): string | "unorganized" => {
    // Find the workspace that contains this space
    const findWorkspaceWithSpace = (workspaces: Workspace[]): string | null => {
      for (const workspace of workspaces) {
        if (workspace.spaces?.some((nb) => nb.id === spaceId)) {
          return workspace.id;
        }
        if (workspace.children && workspace.children.length > 0) {
          const childResult = findWorkspaceWithSpace(workspace.children);
          if (childResult) return childResult;
        }
      }
      return null;
    };

    const workspaceId = findWorkspaceWithSpace(workspaces);
    return workspaceId || "unorganized";
  };

  // Refresh workspaces when component mounts
  useEffect(() => {
    if (supabaseUserId) {
      refreshWorkspaces();
    }
  }, [supabaseUserId]);

  // Refresh workspaces when selected workspace changes
  useEffect(() => {
    if (
      supabaseUserId &&
      selectedWorkspaceId &&
      selectedWorkspaceId !== "unorganized"
    ) {
      refreshWorkspaces();
    }
  }, [selectedWorkspaceId, supabaseUserId]);

  useEffect(() => {
    async function fetchSpaces() {
      if (!supabaseUserId) return;

      setIsLoading(true);
      try {
        let result;

        if (selectedWorkspaceId === null) {
          // Show all spaces
          result = await getUserSpaces(supabaseUserId);
        } else if (selectedWorkspaceId === "unorganized") {
          // Show unorganized spaces
          result = await getUnorganizedSpaces(supabaseUserId);
        } else {
          // Show spaces in the selected workspace
          if (includeNestedSpaces) {
            result = await getSpacesInWorkspaceRecursive(selectedWorkspaceId);
          } else {
            result = await getSpacesInWorkspace(selectedWorkspaceId);
          }
        }

        if (result.success && result.data) {
          setSpaces(result.data);
        } else {
          setError("Failed to load spaces");
        }
      } catch (err) {
        console.error("Error fetching spaces:", err);
        setError("An error occurred while loading spaces");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSpaces();
  }, [supabaseUserId, selectedWorkspaceId, includeNestedSpaces]);

  // Fetch workspaces for dropdown
  useEffect(() => {
    async function fetchWorkspaces() {
      if (!supabaseUserId) return;

      try {
        const result = await getUserWorkspacesHierarchy(supabaseUserId);
        if (result.success && result.data) {
          setWorkspaces(result.data);
        }
      } catch (err) {
        console.error("Error fetching workspaces:", err);
      }
    }

    fetchWorkspaces();
  }, [supabaseUserId, selectedWorkspaceId]);

  const handleCreateSpace = async (spaceData: {
    title: string;
    description: string;
    workspaceId: string | "unorganized";
  }) => {
    if (!supabaseUserId) return;

    try {
      // Use the workspace-aware space creation with the selected workspace
      const workspaceId =
        spaceData.workspaceId !== "unorganized"
          ? spaceData.workspaceId
          : undefined;

      const result = await createSpaceWithWorkspace(
        supabaseUserId,
        spaceData.title,
        spaceData.description || undefined,
        workspaceId,
      );

      if (result.success && result.data) {
        // Only add to the UI list if we're in the right view
        if (
          selectedWorkspaceId === null || // All spaces
          (selectedWorkspaceId === "unorganized" && !workspaceId) || // Unorganized view and no workspace selected
          (workspaceId && selectedWorkspaceId === workspaceId) // Current workspace matches selected workspace
        ) {
          setSpaces([result.data, ...spaces]);
        }

        setShowModal(false);
        setError(null);

        // Navigate to the new space
        navigate(`/spaces/${result.data.id}`);
      } else {
        setError("Failed to create space");
      }
    } catch (err) {
      console.error("Error creating space:", err);
      setError("An error occurred while creating the space");
      throw err;
    }
  };

  const handleUpdateSpace = async (spaceData: {
    title: string;
    description: string;
    workspaceId: string | "unorganized";
  }) => {
    if (!editingSpace) return;

    try {
      const workspaceId =
        spaceData.workspaceId !== "unorganized"
          ? spaceData.workspaceId
          : undefined;

      const result = await updateSpaceWithWorkspace(
        editingSpace.id,
        {
          title: spaceData.title,
          description: spaceData.description || undefined,
        },
        workspaceId,
      );

      if (result.success && result.data) {
        // Update the space in the list
        setSpaces(
          spaces.map((nb) =>
            nb.id === editingSpace.id ? result.data! : nb,
          ),
        );

        // If workspace changed, we might need to refresh the view
        if (getCurrentWorkspaceId(editingSpace.id) !== spaceData.workspaceId) {
          // If we're in a specific workspace view and the space was moved out
          if (
            selectedWorkspaceId &&
            selectedWorkspaceId !== "unorganized" &&
            selectedWorkspaceId !== spaceData.workspaceId
          ) {
            setSpaces(
              spaces.filter((nb) => nb.id !== editingSpace.id),
            );
          }
        }

        setShowModal(false);
        setEditingSpace(null);
        setIsEditing(false);
        setError(null);
      } else {
        setError("Failed to update space");
      }
    } catch (err) {
      console.error("Error updating space:", err);
      setError("An error occurred while updating the space");
      throw err;
    }
  };

  const handleSelectWorkspace = (workspaceId: string | null) => {
    setSelectedWorkspaceId(workspaceId);
  };

  const getWorkspaceTitle = () => {
    if (selectedWorkspaceId === null) return "All Spaces";
    if (selectedWorkspaceId === "unorganized") return "Unorganized Spaces";

    // Find the selected workspace's title
    const findWorkspaceName = (workspaces: Workspace[]): string | null => {
      for (const workspace of workspaces) {
        if (workspace.id === selectedWorkspaceId) {
          return workspace.title;
        }
        if (workspace.children && workspace.children.length > 0) {
          const childResult = findWorkspaceName(workspace.children);
          if (childResult) return childResult;
        }
      }
      return null;
    };

    const workspaceName = findWorkspaceName(workspaces);

    // If we couldn't find the workspace name, refresh workspaces and return a placeholder
    if (!workspaceName) {
      refreshWorkspaces();
      return "Loading Workspace...";
    }

    return workspaceName;
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingSpace(null);
    setShowModal(true);
  };

  const openEditModal = (space: Space) => {
    setIsEditing(true);
    setEditingSpace(space);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingSpace(null);
  };

  const handleSubmit = async (spaceData: {
    title: string;
    description: string;
    workspaceId: string | "unorganized";
  }) => {
    if (isEditing && editingSpace) {
      return handleUpdateSpace(spaceData);
    } else {
      return handleCreateSpace(spaceData);
    }
  };

  // Check if the current view is a specific workspace (not All or Unorganized)
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    async function checkIfParentWorkspace() {
      if (selectedWorkspaceId && selectedWorkspaceId !== "unorganized") {
        const result = await isParentWorkspace(selectedWorkspaceId);
        setIsParent(!!result);
      } else {
        setIsParent(false);
      }
    }

    checkIfParentWorkspace();
  }, [selectedWorkspaceId]);

  // Only show toggle if we're in a specific workspace view that has children
  const showNestedToggle =
    selectedWorkspaceId !== null && selectedWorkspaceId !== "unorganized" && isParent;

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      {supabaseUserId && (
        <Sidebar
          userId={supabaseUserId}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          selectedWorkspaceId={selectedWorkspaceId}
          onSelectWorkspace={handleSelectWorkspace}
          onWorkspacesUpdated={refreshWorkspaces}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-12">
        {/* <Header /> */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="flex space-x-10 items-center mb-8">
              <h1 className="text-3xl font-bold text-adaptive">
                {getWorkspaceTitle()}
              </h1>

              {/* Toggle for including nested spaces - only show in workspace view */}
              {showNestedToggle && (
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={includeNestedSpaces}
                      onChange={() =>
                        setIncludeNestedSpaces(!includeNestedSpaces)
                      }
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-black dark:peer-checked:bg-white"></div>
                    <span className="ms-3 text-sm font-medium text-adaptive">
                      Include nested spaces
                    </span>
                  </label>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Space creation card */}
                {spaces.length !== 0 && (
                  <div
                    onClick={openCreateModal}
                    className="flex flex-col items-center justify-center bg-transparent border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors h-full min-h-[200px]"
                  >
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-gray-500 dark:text-gray-400"
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
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Create New Space
                      </p>
                    </div>
                  </div>
                )}

                {/* Space cards */}
                {spaces.map((space) => (
                  <div
                    key={space.id}
                    className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative group"
                  >
                    <Link to={`/spaces/${space.id}`} className="block">
                      <h2 className="text-xl font-bold text-adaptive mb-2">
                        {space.title}
                      </h2>
                      {space.description && (
                        <p className="text-muted mb-4">
                          {space.description}
                        </p>
                      )}
                      <div className="text-sm text-muted">
                        Created{" "}
                        {new Date(space.created_at).toLocaleDateString()}
                      </div>
                    </Link>

                    {/* Edit button - appears on hover */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEditModal(space);
                      }}
                      className="absolute top-3 right-3 p-2 bg-hover dark:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      aria-label="Edit space"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-600 dark:text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && spaces.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted text-lg mb-4">
                  {selectedWorkspaceId === null
                    ? "You don't have any spaces yet."
                    : selectedWorkspaceId === "unorganized"
                      ? "You don't have any unorganized spaces."
                      : "This workspace doesn't contain any spaces."}
                </p>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Create Space
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Space Modal - for both creating and editing */}
      <SpaceModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        workspaces={workspaces}
        initialData={
          editingSpace
            ? {
                title: editingSpace.title,
                description: editingSpace.description || "",
                workspaceId: getCurrentWorkspaceId(editingSpace.id),
              }
            : undefined
        }
        isEditing={isEditing}
        selectedWorkspaceId={
          selectedWorkspaceId !== "unorganized" ? selectedWorkspaceId : undefined
        }
      />
    </div>
  );
}
