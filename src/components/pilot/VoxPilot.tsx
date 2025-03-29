import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../../services/supabase";
import { streamChatWithGemini, formatMessagesForGemini } from "../../services/geminiService";
import { type ChatMessage, type ChatSession } from "../../types/chat";
import { type Model, DEFAULT_MODEL } from "../../types/models";
import PilotInput from "./PilotInput";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useNoteState } from "../../hooks/useNoteState";
import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Define a custom interface for code component props (taken from ChatView)
interface CodeComponentProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

// Custom hook for dark mode detection (taken from ChatView)
function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial color scheme
    const checkColorScheme = () => {
      const isDark = 
        document.documentElement.classList.contains('force-dark') || 
        (document.documentElement.classList.contains('color-scheme-adaptive') && 
         window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(isDark);
    };

    // Check on mount
    checkColorScheme();

    // Set up listeners for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => checkColorScheme();
    mediaQuery.addEventListener('change', handleChange);

    // Observer for class changes on html element
    const observer = new MutationObserver(checkColorScheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      observer.disconnect();
    };
  }, []);

  return isDarkMode;
}

// CodeBlock component with copy button (taken from ChatView)
const CodeBlock = ({
  children,
  className,
  onCopy,
  isCopied,
}: {
  children?: React.ReactNode;
  className?: string;
  onCopy: (text: string) => void;
  isCopied: boolean;
}) => {
  const language = className ? className.replace(/language-/, "") : "";
  const codeContent = typeof children === 'string' ? children : '';
  const isDarkMode = useDarkMode();

  return (
    <div className="relative group rounded-lg overflow-hidden">
      <SyntaxHighlighter
        style={isDarkMode ? oneDark : oneLight}
        language={language || 'text'}
        PreTag="div"
        className="!rounded-lg !m-0"
        customStyle={{
          borderRadius: '0.5rem',
          margin: 0,
        }}
      >
        {codeContent}
      </SyntaxHighlighter>
      <button
        onClick={() => onCopy(codeContent)}
        className="absolute top-2 right-2 bg-[color-mix(in_oklch,var(--color-primary,#6c47ff)_20%,transparent)] px-2 py-1 rounded text-sm hover:opacity-80 transition-opacity opacity-0 group-hover:opacity-100"
        aria-label="Copy code"
      >
        {isCopied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
};

interface VoxPilotProps {
  sidebarOpen?: boolean;
  simplified?: boolean;
  className?: string;
}

/**
 * VoxPilot - A simplified version of Chat for direct AI interaction
 * This component provides a streamlined interface for chat with fewer views
 * and less complex state management compared to the full Chat component.
 */
const VoxPilot: React.FC<VoxPilotProps> = ({ className = "" }) => {
  const { user } = useUser();
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  // Simplified state for just two question types
  const [isCodingQuestion, setIsCodingQuestion] = useState(false);
  const [isNoteQuestion, setIsNoteQuestion] = useState(false);
  
  // Add state for model selection
  const [selectedModel, setSelectedModel] = useState<Model>(DEFAULT_MODEL);
  
  // Use our note state hook to check if a note is open
  const { isNoteOpen, noteId, noteContent, fetchNoteContent } = useNoteState();

  // Create a new session when component mounts or ensure a session exists
  useEffect(() => {
    if (user?.id) {
      ensureSessionExists();
    }
  }, [user?.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);

  // Ensure a session exists for the user or create a new one
  const ensureSessionExists = async () => {
    if (!user?.id) return;
    
    try {
      // Check for most recent session
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (error) {
        console.error("Error fetching sessions:", error);
        return;
      }
      
      if (data && data.length > 0) {
        // Use the most recent session
        setCurrentSession(data[0]);
        await fetchMessages(data[0].id);
      } else {
        // Create a new session if none exists
        await createChatSession();
      }
    } catch (error) {
      console.error("Error in ensureSessionExists:", error);
    }
  };

  // Fetch messages for a chat session
  const fetchMessages = async (sessionId: string) => {
    if (!sessionId) return;
    
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    }
  };

  // Create a new chat session
  const createChatSession = async () => {
    if (!user?.id) {
      console.error("Cannot create chat session: User ID is missing");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert([
          {
            user_id: user.id,
            space_id: "00000000-0000-0000-0000-000000000000", // Default space ID
            title: "VoxPilot Session",
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating chat session:", error);
        return null;
      }

      setCurrentSession(data);
      return data;
    } catch (error) {
      console.error("Error creating chat session:", error);
      return null;
    }
  };

  // Save a message to the database
  const saveMessage = async (content: string, isUser: boolean, session: ChatSession) => {
    if (!user?.id) {
      console.error("Cannot save message: User ID is missing");
      return false;
    }

    try {
      const { error } = await supabase.from("chat_messages").insert([
        {
          chat_session_id: session.id,
          notebook_id: session.space_id,
          user_id: user.id,
          content,
          is_user: isUser,
        },
      ]);

      if (error) {
        console.error("Error saving message:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error saving message:", error);
      return false;
    }
  };

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;

    // Make sure we have a user and session
    if (!user?.id) {
      console.error("Cannot send message: User is not authenticated");
      return;
    }
    
    // Ensure we have a session
    if (!currentSession) {
      const newSession = await createChatSession();
      if (!newSession) {
        console.error("Failed to create new chat session");
        return;
      }
    }

    const userMessage = inputMessage.trim();
    setInputMessage("");

    try {
      // Create the message object
      const userMessageObj: ChatMessage = {
        id: crypto.randomUUID(),
        chat_session_id: currentSession!.id,
        notebook_id: currentSession!.space_id,
        user_id: user.id,
        content: userMessage,
        is_user: true,
        created_at: new Date().toISOString(),
      };
      
      // Add to UI immediately
      setMessages((prevMessages) => [...prevMessages, userMessageObj]);
      
      // Save to database
      await saveMessage(userMessage, true, currentSession!);
      
      // Stream AI response
      await streamResponse(userMessageObj);
    } catch (error) {
      console.error("Error handling message submission:", error);
    }
  };

  // Stream a response from the AI
  const streamResponse = async (userMessage: ChatMessage) => {
    try {
      setIsStreaming(true);
      setStreamingContent("");

      // Format messages for Gemini API
      const formattedMessages = formatMessagesForGemini([
        ...messages,
        userMessage,
      ]);
      
      // Check if a note is open and fetch its content if needed
      let noteContent: string | null = null;
      console.log("isNoteOpen", isNoteOpen);
      if (isNoteOpen) {
        console.log("Note is open, fetching note content...");
        try {
          noteContent = await fetchNoteContent();
          if (noteContent) {
            console.log(`Successfully fetched note content (${noteContent.length} characters)`);
          } else {
            console.warn("No note content could be fetched");
          }
        } catch (error) {
          console.error("Error fetching note content:", error);
        }
      }

      // Stream the response
      let finalContent = "";
      await streamChatWithGemini(
        formattedMessages,
        (content) => {
          finalContent = content;
          setStreamingContent(content);
        },
        user?.id || null,
        isCodingQuestion,
        isNoteQuestion,
        undefined, // noteToggledFiles - using default
        noteContent || undefined, // Only pass noteContent if it exists
        selectedModel, // Pass the selected model
        currentSession!.space_id, // Pass the space ID
        noteId, // Pass the note ID as active file ID if a note is open
      );

      // Save the response to the database
      if (finalContent.trim()) {
        await saveMessage(finalContent, false, currentSession!);

        // Add AI response to messages array
        const aiResponse: ChatMessage = {
          id: crypto.randomUUID(),
          chat_session_id: userMessage.chat_session_id,
          notebook_id: userMessage.notebook_id,
          user_id: user?.id || "",
          content: finalContent,
          is_user: false,
          created_at: new Date().toISOString(),
        };

        setMessages((prevMessages) => [...prevMessages, aiResponse]);
      }
    } catch (error) {
      console.error("Error streaming response:", error);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  // Handle textarea autoresizing
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  };

  // Handle code copying
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };
  
  // For the simplified view, implement our own version with consistent markdown rendering
  return (
    <div className={`flex flex-col h-full relative ${className}`}>
      {/* Messages display */}
      <div ref={messageContainerRef} className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 ${message.is_user ? "text-right" : "text-left"}`}
            >
              {message.is_user ? (
                <div className="inline-block bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-left max-w-[85%]">
                  <p className="break-words whitespace-pre-wrap">{message.content}</p>
                </div>
              ) : (
                <div className="prose prose-gray dark:prose-invert max-w-none overflow-hidden">
                  <Markdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    components={{
                      code: (props) => {
                        const { inline, className, children, ...rest } = props as CodeComponentProps;
                        const match = /language-(\w+)/.exec(className || '');
                        
                        if (!inline && match) {
                          return (
                            <CodeBlock
                              className={className}
                              onCopy={handleCopyCode}
                              isCopied={copiedText === (typeof children === 'string' ? children : '')}
                            >
                              {typeof children === 'string' ? children.replace(/\n$/, '') : children}
                            </CodeBlock>
                          );
                        }
                        
                        return (
                          <code 
                            className={`${inline ? 'bg-[color-mix(in_oklch,var(--color-primary,#6c47ff)_10%,transparent)] px-1.5 py-0.5 rounded' : ''} ${className || ''}`}
                            {...rest}
                          >
                            {children}
                          </code>
                        );
                      },
                      pre: ({ node, children, ...rest }) => (
                        <pre 
                          {...rest}
                          className="bg-background !p-0 !m-0 overflow-hidden"
                        >
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {message.content}
                  </Markdown>
                </div>
              )}
            </div>
          ))}
          
          {/* Streaming message */}
          {isStreaming && streamingContent && (
            <div className="mb-4 text-left">
              <div className="prose prose-gray dark:prose-invert max-w-none overflow-hidden">
                <Markdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                  components={{
                    code: (props) => {
                      const { inline, className, children, ...rest } = props as CodeComponentProps;
                      const match = /language-(\w+)/.exec(className || '');
                      
                      if (!inline && match) {
                        return (
                          <CodeBlock
                            className={className}
                            onCopy={handleCopyCode}
                            isCopied={copiedText === (typeof children === 'string' ? children : '')}
                          >
                            {typeof children === 'string' ? children.replace(/\n$/, '') : children}
                          </CodeBlock>
                        );
                      }
                      
                      return (
                        <code 
                          className={`${inline ? 'bg-[color-mix(in_oklch,var(--color-primary,#6c47ff)_10%,transparent)] px-1.5 py-0.5 rounded' : ''} ${className || ''}`}
                          {...rest}
                        >
                          {children}
                        </code>
                      );
                    },
                    pre: ({ node, children, ...rest }) => (
                      <pre 
                        {...rest}
                        className="bg-background !p-0 !m-0 overflow-hidden"
                      >
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {streamingContent}
                </Markdown>
              </div>
            </div>
          )}
          
          {/* Reference for scrolling to bottom */}
          <div ref={messagesEndRef} className="h-12" />
        </div>
      </div>
      
      {/* Input component */}
      <PilotInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        isStreaming={isStreaming}
        textareaRef={textareaRef}
        autoResizeTextarea={autoResizeTextarea}
        isCodingQuestion={isCodingQuestion}
        setIsCodingQuestion={setIsCodingQuestion}
        isNoteQuestion={isNoteQuestion}
        setIsNoteQuestion={setIsNoteQuestion}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />
    </div>
  );
};

export default VoxPilot;