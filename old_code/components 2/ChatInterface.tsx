import React, { useState, useEffect, useRef } from "react";
import { ChatInterfaceProps } from "../types/chat";
import ChatBar from "./chat/ChatBar";

// Add animation styles
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;

// TODO: add more tools (first tool: generate educational video, second tool: make a coding environment, third tool: canvas to draw)

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentChatSession,
  messages,
  isLoadingMessages,
  isStreaming,
  streamingContent,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  handleCreateSession,
  messagesEndRef,
  isCodingQuestion,
  setIsCodingQuestion,
  isNoteQuestion,
  setIsNoteQuestion,
}) => {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  // Auto-resize textarea function
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height first
    textarea.style.height = "auto";

    // Set to scrollHeight (capped at max-h-[25vh] through CSS class)
    textarea.style.height = `${Math.min(textarea.scrollHeight, window.innerHeight * 0.25)}px`;
  };

  // Initialize textarea height when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, []);

  // Reset height and then auto-resize when inputMessage changes
  useEffect(() => {
    if (textareaRef.current && inputMessage === "") {
      // Reset to default height when empty
      textareaRef.current.style.height = "auto";
    } else {
      autoResizeTextarea();
    }
  }, [inputMessage]);

  return (
    <>
      {/* Add the animation styles */}
      <style>{animationStyles}</style>
      <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background">
        {!currentChatSession ? (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 pt-4">
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
                <div className="p-6 bg-card rounded-2xl shadow-sm max-w-md w-full text-center">
                  <h3 className="text-xl font-semibold text-adaptive mb-2">
                    Welcome to VoxAI Chat
                  </h3>
                  <p className="text-muted mb-6">
                    Start a new chat to interact with your files and get
                    intelligent responses
                  </p>
                  <button
                    onClick={handleCreateSession}
                    className="px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm font-medium cursor-pointer"
                  >
                    Start New Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Main chat area with messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 pt-12 pb-32">
                <div className="flex flex-col h-full">
                  <div className="flex-1 mb-4">
                    {isLoadingMessages ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
                      </div>
                    ) : messages.length === 0 && !isStreaming ? (
                      <div className="text-center py-12">
                        <p className="text-muted">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Display messages from Supabase */}
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className="w-full py-4 animate-fadeIn"
                          >
                            <div className="flex items-start">
                              {/* Message content */}
                              <div
                                className={`flex-1 p-4 rounded-2xl ${
                                  message.is_user ? "bg-card" : ""
                                } transition-all duration-300 ease-out`}
                              >
                                <div className="flex items-center mb-1">
                                  <p className="text-sm font-medium text-adaptive">
                                    {message.is_user ? "You" : "VoxAI"}
                                  </p>
                                  <span className="mx-2 text-gray-300 dark:text-gray-600">
                                    •
                                  </span>
                                  <p className="text-xs text-muted">
                                    {new Date(
                                      message.created_at,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                                <div className="prose dark:prose-invert max-w-none">
                                  <p className="whitespace-pre-wrap text-adaptive">
                                    {message.content}
                                  </p>
                                </div>

                                {/* Copy button */}
                                <div className="mt-2 flex justify-end">
                                  <button
                                    onClick={() =>
                                      handleCopyMessage(
                                        message.content,
                                        message.id,
                                      )
                                    }
                                    className="flex items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors cursor-pointer"
                                    aria-label="Copy message"
                                  >
                                    {copiedMessageId === message.id ? (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4 mr-1"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4 mr-1"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                          />
                                        </svg>
                                        Copy
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Display streaming content if active */}
                        {isStreaming && streamingContent && (
                          <div className="w-full py-4">
                            <div className="flex items-start">
                              {/* Message content */}
                              <div className="flex-1 p-4">
                                <div className="flex items-center mb-1">
                                  <p className="text-sm font-medium text-adaptive">
                                    VoxAI
                                  </p>
                                  <span className="mx-2 text-gray-300 dark:text-gray-600">
                                    •
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse"></div>
                                    <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse delay-75"></div>
                                    <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse delay-150"></div>
                                  </div>
                                </div>
                                <div className="prose dark:prose-invert max-w-none">
                                  <p className="whitespace-pre-wrap text-adaptive">
                                    {streamingContent}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <ChatBar 
              handleSendMessage={handleSendMessage}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              isStreaming={isStreaming}
              textareaRef={textareaRef}
              autoResizeTextarea={autoResizeTextarea}
              isCodingQuestion={isCodingQuestion}
              setIsCodingQuestion={setIsCodingQuestion}
              isNoteQuestion={isNoteQuestion}
              setIsNoteQuestion={setIsNoteQuestion}
            />
          </>
        )}
      </div>
    </>
  );
};

export default ChatInterface;
