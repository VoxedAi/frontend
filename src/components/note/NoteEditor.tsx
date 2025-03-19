import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Block, BlockNoteEditor as BlockNoteEditorCore, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from '@blocknote/mantine';
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useTheme } from '../../contexts/ThemeContext';

// Define proper types for the BlockNoteEditor props
interface BlockNoteEditorProps {
  onClose: () => void;
  noteId: string;
  noteContent: string;
  onSave: (content: string) => void;
  noteName: string;
}

// Error boundary component to catch errors in BlockNoteView
class EditorErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    onError: (error: Error, info: React.ErrorInfo) => void;
  },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    onError: (error: Error, info: React.ErrorInfo) => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-800 rounded-md">
          <h3 className="text-lg font-medium mb-2">
            Something went wrong with the note editor
          </h3>
          <p className="mb-4">
            We've encountered an error displaying the editor. Please try the
            following:
          </p>
          <ul className="list-disc ml-5 mb-4">
            <li>Refresh the page</li>
            <li>Try creating a new note</li>
            <li>Check your internet connection</li>
          </ul>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-hover transition-all duration-200"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Import the BlockNote component that will be displayed when a note is clicked
const BlockNoteEditor: React.FC<BlockNoteEditorProps> = ({ onClose, noteId, noteContent, onSave, noteName }) => {
  const { theme } = useTheme();
  const [content, setContent] = useState<string>(noteContent);
  const [isLoading, setIsLoading] = useState<boolean>(!noteContent);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showSaved, setShowSaved] = useState<boolean>(false);
  const editorRef = useRef<BlockNoteEditorCore | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // When noteContent changes (after loading), update the editor content
  useEffect(() => {
    if (noteContent) {
      setContent(noteContent);
      setIsLoading(false);
    }
  }, [noteContent]);
  
  // Create a valid empty document structure
  const createEmptyDocument = useCallback(() => {
    try {
      // Create a temporary editor to get a valid empty document structure
      const tempEditor = BlockNoteEditorCore.create();
      return tempEditor.document;
    } catch (error) {
      console.error("Error creating empty document:", error);
      // Return a minimal valid structure if editor creation fails
      return [{ 
        id: "1", 
        type: "paragraph", 
        content: [{ 
          type: "text", 
          text: "", 
          styles: {} 
        }] 
      }];
    }
  }, []);
  
  // Parse the content safely
  const initialContent = React.useMemo(() => {
    try {
      if (!noteContent || noteContent.trim() === '') {
        return createEmptyDocument();
      }
      
      const parsed = JSON.parse(noteContent);
      
      // Check if the content is in the expected format
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate that the array contains valid blocks
        if (parsed[0].type && parsed[0].id) {
          return parsed;
        }
      } else if (parsed && parsed.content && Array.isArray(parsed.content) && parsed.content.length > 0) {
        // Validate that the content array contains valid blocks
        if (parsed.content[0].type && parsed.content[0].id) {
          return parsed.content;
        }
      }
      
      // If we reach here, the content is not in a valid format
      return createEmptyDocument();
    } catch (e) {
      console.error('Error parsing note content:', e);
      return createEmptyDocument();
    }
  }, [noteContent, createEmptyDocument]);
  
  // Create a memoized BlockNoteEditor
  const editor = React.useMemo(() => {
    try {
      // Ensure initialContent is valid before creating the editor
      if (!Array.isArray(initialContent) || initialContent.length === 0) {
        throw new Error("Invalid initialContent format");
      }
      
      // Create editor with system theme compatible settings
      const newEditor = BlockNoteEditorCore.create({
        initialContent,
      });
      editorRef.current = newEditor;
      return newEditor;
    } catch (error) {
      console.error("Error creating BlockNoteEditor:", error);
      // Create empty editor as fallback with a valid empty document
      try {
        const fallbackEditor = BlockNoteEditorCore.create({
          initialContent: [{ 
            id: "1", 
            type: "paragraph", 
            content: [{ 
              type: "text", 
              text: "", 
              styles: {} 
            }] 
          }]
        });
        editorRef.current = fallbackEditor;
        return fallbackEditor;
      } catch (fallbackError) {
        console.error("Critical error creating fallback editor:", fallbackError);
        // Return null to trigger error boundary
        return null;
      }
    }
  }, [initialContent]);
  
  // Safe function to get editor document
  const getEditorDocument = useCallback(() => {
    try {
      if (editorRef.current) {
        return editorRef.current.document;
      }
      return null;
    } catch (error) {
      console.error("Error accessing editor document:", error);
      return null;
    }
  }, []);
  
  // Safe onChange handler
  const handleEditorChange = useCallback(() => {
    try {
      setIsLoading(true);
      const document = getEditorDocument();
      if (document) {
        const content = JSON.stringify(document);
        onSave(content);
        setTimeout(() => setIsLoading(false), 500);
      }
    } catch (error) {
      console.error("Error in editor onChange handler:", error);
      setError("Failed to save changes");
      setIsLoading(false);
    }
  }, [onSave, getEditorDocument]);
  
  // Handle editor errors
  const handleEditorError = useCallback(
    (error: Error, info: React.ErrorInfo) => {
      console.error("Editor error:", error, info);
      setError(error.message);
      // Attempt to recreate the editor
      try {
        const tempEditor = BlockNoteEditorCore.create({
          initialContent: [{ 
            id: "1", 
            type: "paragraph", 
            content: [{ 
              type: "text", 
              text: "", 
              styles: {} 
            }] 
          }]
        });
        editorRef.current = tempEditor;
      } catch (e) {
        console.error("Failed to recreate editor:", e);
      }
    },
    []
  );
  
  // If editor creation failed completely, show a fallback UI
  if (!editor) {
    return (
      <div className="w-full h-full">
        <div className="flex justify-between items-center mb-4 p-2 border-b">
          <h2 className="text-xl font-medium">{noteName}</h2>
          <button 
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
          >
            Close
          </button>
        </div>
        <div className="p-4 bg-red-50 text-red-800 rounded-md">
          <h3 className="text-lg font-medium mb-2">
            Unable to load note editor
          </h3>
          <p className="mb-4">
            We couldn't initialize the note editor. Please try refreshing the page.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-hover transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Renders the editor instance using a React component.
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      <div className="p-2 flex items-center justify-between z-10 border-b">
        <div className="relative w-full">
          <div className="cursor-pointer flex items-center justify-between w-full px-2 py-1 text-sm font-medium text-left text-adaptive transition-all duration-200">
            <span className="truncate flex items-center">
              {noteName}
              <span
                className={`ml-2 text-xs transition-opacity duration-300 ${isLoading ? "text-yellow-500" : error ? "text-red-500" : "text-green-500"}`}
              >
                {isLoading ? "loading..." : error ? "error loading" : "loaded"}
              </span>
            </span>
            <button 
              onClick={onClose}
              className="px-3 py-1 bg-card hover:bg-hover rounded-md text-sm transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto w-full">
        {error && (
          <div className="p-2 mb-2 text-sm bg-red-100 text-red-800 rounded">
            Error loading: {error}
            <button
              className="ml-2 underline px-1 py-0.5 rounded transition-all duration-200"
              onClick={() => {
                setError(null);
                if (editorRef.current) {
                  const document = getEditorDocument();
                  if (document) {
                    const content = JSON.stringify(document);
                    onSave(content);
                  }
                }
              }}
            >
              Retry
            </button>
          </div>
        )}
        
        <EditorErrorBoundary onError={handleEditorError}>
          <div className="h-full w-full overflow-auto">
            <BlockNoteView 
              editor={editor} 
              onChange={handleEditorChange}
              theme={theme === 'dark' ? 'dark' : 'light'}
            />
          </div>
        </EditorErrorBoundary>
      </div>
    </div>
  );
};

export default BlockNoteEditor; 