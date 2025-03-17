import { useState, useEffect } from "react";
import type { Workspace } from "../services/supabase";

interface SpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (spaceData: {
    title: string;
    description: string;
    workspaceId: string | "unorganized";
  }) => Promise<void>;
  workspaces: Workspace[];
  initialData?: {
    title: string;
    description: string;
    workspaceId: string | "unorganized";
  };
  isEditing: boolean;
  selectedWorkspaceId?: string | null;
}

export default function SpaceModal({
  isOpen,
  onClose,
  onSubmit,
  workspaces,
  initialData,
  isEditing,
  selectedWorkspaceId,
}: SpaceModalProps) {
  const MAX_TITLE_LENGTH = 30;
  const MAX_DESCRIPTION_LENGTH = 300;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string | "unorganized">(
    "unorganized",
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setWorkspaceId(initialData.workspaceId);
    } else if (selectedWorkspaceId && selectedWorkspaceId !== "unorganized") {
      setWorkspaceId(selectedWorkspaceId);
    }
  }, [initialData, selectedWorkspaceId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Space title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        workspaceId,
      });

      // Reset form
      if (!isEditing) {
        setTitle("");
        setDescription("");
        setWorkspaceId("unorganized");
      }
      setError(null);
    } catch (err) {
      console.error("Error submitting space:", err);
      setError("An error occurred while saving the space");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recursive function to build workspace options
  const renderWorkspaceOptions = (workspaces: Workspace[], depth = 0) => {
    const options: JSX.Element[] = [];

    workspaces.forEach((workspace) => {
      // Add the current workspace with proper indentation
      options.push(
        <option key={workspace.id} value={workspace.id}>
          {"\u00A0".repeat(depth * 4)}
          {depth > 0 ? "↳ " : ""}
          {workspace.title}
        </option>,
      );

      // Add children if any
      if (workspace.children && workspace.children.length > 0) {
        options.push(...renderWorkspaceOptions(workspace.children, depth + 1));
      }
    });

    return options;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bg-overlay inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-adaptive mb-6">
            {isEditing ? "Edit Space" : "Create New Space"}
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="title" className="text-muted">
                  Space name
                </label>
                <span className="text-sm text-muted">
                  {title.length}/{MAX_TITLE_LENGTH}
                </span>
              </div>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))
                }
                className="w-full px-4 py-3 border border-adaptive rounded-lg bg-input text-adaptive focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter space name"
                required
                autoFocus
              />
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="description" className="text-muted">
                  Space description
                </label>
                <span className="text-sm text-muted">
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value.slice(0, MAX_DESCRIPTION_LENGTH),
                  )
                }
                className="w-full px-4 py-3 border border-adaptive rounded-lg bg-input text-adaptive focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter space description"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="workspace" className="block text-muted mb-2">
                Workspace
              </label>
              <select
                id="workspace"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="w-full px-4 py-3 border border-adaptive rounded-lg bg-input text-adaptive focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="unorganized">Unorganized</option>
                {renderWorkspaceOptions(workspaces)}
              </select>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-muted hover:text-adaptive transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                disabled={!title.trim() || isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
