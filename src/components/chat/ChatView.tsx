import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { ClipboardIcon, CheckIcon, ChevronDown, BrainCircuit } from "lucide-react";
import { ChatMessage, ReasoningData } from "../../types/chat";
import { type Model, DEFAULT_MODEL, MODELS, MODEL_DISPLAY_NAMES } from "../../types/models";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Tooltip from "../common/Tooltip";
import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Define a custom interface for code component props
interface CodeComponentProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

// Custom hook for dark mode detection
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

interface ChatViewProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  copiedText: string | null;
  handleCopyCode: (text: string) => void;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isStreamingState: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  autoResizeTextarea: () => void;
  isCodingQuestion: boolean;
  setIsCodingQuestion: (value: boolean) => void;
  isNoteQuestion: boolean;
  setIsNoteQuestion: (value: boolean) => void;
  selectedModel?: Model;
  setSelectedModel?: (model: Model) => void;
  onBackClick: () => void;
  sidebarOpen?: boolean;
  simplified?: boolean;
}

// Markdown code block component with copy button and syntax highlighting
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

const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isStreaming,
  streamingContent,
  copiedText,
  handleCopyCode,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  isStreamingState,
  textareaRef,
  autoResizeTextarea,
  isCodingQuestion,
  setIsCodingQuestion,
  isNoteQuestion,
  setIsNoteQuestion,
  selectedModel = DEFAULT_MODEL,
  setSelectedModel,
  onBackClick,
  sidebarOpen,
  simplified = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [endSpacerHeight, setEndSpacerHeight] = useState(64);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  
  // Map to store reasoning data for each message
  const [reasoningData, setReasoningData] = useState<Map<string, ReasoningData>>(new Map());
  // For streaming message reasoning
  const [streamingReasoning, setStreamingReasoning] = useState<string>("");
  const [showStreamingReasoning, setShowStreamingReasoning] = useState<boolean>(false);

  // CSS for the pulse animation
  const pulseAnimation = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.9; }
      50% { transform: scale(1.05); opacity: 1; }
      100% { transform: scale(1); opacity: 0.9; }
    }
    .pulse-animation {
      animation: pulse 2s infinite ease-in-out;
      animation-duration: 50s;
    }
  `;

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Check if user is currently scrolled to the bottom of the chat
  const checkIfUserAtBottom = () => {
    if (!messageContainerRef.current) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
    // Consider "at bottom" if within 100px of the bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsUserAtBottom(isAtBottom);
    setShowScrollBottom(!isAtBottom);
    return isAtBottom;
  };

  // Calculate the appropriate spacing based on content
  const calculateSpacerHeight = () => {
    if (!messageContainerRef.current || !messagesEndRef.current) return;
    
    const containerHeight = messageContainerRef.current.clientHeight;
    const messagesEndHeight = messagesEndRef.current.clientHeight || 0;
    const scrollHeight = messageContainerRef.current.scrollHeight;
    const contentHeight = scrollHeight - messagesEndHeight;
    const chatInputHeight = simplified ? 64 : 42; // Increase height buffer for simplified mode
    const bufferSpace = simplified ? 32 : 24; // Increase buffer space for simplified mode
    
    // For small screens, keep it minimal
    const isMobileDevice = window.innerWidth < 768;
    
    // Calculate optimal height
    let newHeight;
    if (contentHeight > containerHeight) {
      // Content overflows, use minimal spacing
      newHeight = chatInputHeight + bufferSpace;
    } else {
      // Content fits, use larger spacing on desktop, smaller on mobile
      newHeight = isMobileDevice ? 64 : (simplified ? 120 : 96);
    }
    
    setEndSpacerHeight(newHeight);
  };

  // Initialize scroll position and setup observers when component mounts
  useEffect(() => {
    // Only auto-scroll on first load
    scrollToBottom('auto');
    calculateSpacerHeight();
    setIsUserAtBottom(true);
    setShowScrollBottom(false);
    
    // Set up resize observer to recalculate heights when window resizes
    const resizeObserver = new ResizeObserver(() => {
      calculateSpacerHeight();
      checkIfUserAtBottom();
    });
    
    // Add scroll event listener to update spacer height during scrolling
    const handleScroll = () => {
      calculateSpacerHeight();
      checkIfUserAtBottom();
    };
    
    if (messageContainerRef.current) {
      resizeObserver.observe(messageContainerRef.current);
      messageContainerRef.current.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      resizeObserver.disconnect();
      messageContainerRef.current?.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Extract reasoning content from message text
  const extractReasoning = (content: string): { text: string, reasoning: string | null } => {
    const reasoningRegex = /<!--reasoning:(.*?)-->/s;
    const match = content.match(reasoningRegex);
    
    if (match && match[1]) {
      // Found reasoning content
      console.log("Found reasoning content - length:", match[1].length);
      
      // Create the cleaned text by removing the reasoning comment
      const cleanedText = content.replace(reasoningRegex, '');
      console.log("Removed reasoning comment - text length before:", content.length, "after:", cleanedText.length);
      
      // Return the content without reasoning comment and the reasoning content
      return {
        text: cleanedText,
        reasoning: match[1].trim()
      };
    }
    
    return { text: content, reasoning: null };
  };
  
  // Process streaming content and check for reasoning tokens
  useEffect(() => {
    if (isStreaming && streamingContent) {
      const { text, reasoning } = extractReasoning(streamingContent);
      
      // If reasoning exists in the streaming content
      if (reasoning) {
        console.log("Found streaming reasoning - length:", reasoning.length);
        setStreamingReasoning(reasoning);
        
        // Note: We don't modify streamingContent here since it's controlled by the parent component
        // The parent component will render 'text' directly from the SSE stream
      }
      
      // Only calculate spacer height during streaming, don't auto-scroll
      calculateSpacerHeight();
      checkIfUserAtBottom();
    }
  }, [isStreaming, streamingContent]);
  
  // Handle streaming completion - add streaming reasoning to the message reasoning data
  useEffect(() => {
    if (!isStreaming && streamingReasoning && messages.length > 0) {
      // When streaming completes, add the reasoning data to the last message
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.is_user && streamingReasoning) {
        console.log("Streaming completed - storing reasoning for message:", lastMessage.id.substring(0, 8));
        
        // Add the reasoning data to the map (overwrite if exists)
        setReasoningData(prev => {
          const newMap = new Map(prev);
          // Set reasoning to be hidden by default
          newMap.set(lastMessage.id, { 
            content: streamingReasoning, 
            visible: false 
          });
          return newMap;
        });
        
        // Make sure the message content doesn't contain reasoning tags
        // (This shouldn't happen normally since it's added after streaming,
        // but this is a safety check)
        if (lastMessage.content.includes('<!--reasoning:')) {
          const { text } = extractReasoning(lastMessage.content);
          lastMessage.content = text;
          console.log("Removed reasoning tags from last message after streaming");
        }
        
        // Clear streaming reasoning now that it's stored in the map
        setStreamingReasoning("");
      }
    }
  }, [isStreaming, messages, streamingReasoning]);
  
  // Scroll to bottom when a new message is added (user submits a message)
  useEffect(() => {
    if (messages.length > lastMessageCount) {
      // Only scroll when user submits a message (not during streaming)
      if (!isStreaming) {
        scrollToBottom();
        setShowScrollBottom(false);
      }
      setLastMessageCount(messages.length);
      calculateSpacerHeight();
    }
  }, [messages.length, lastMessageCount, isStreaming]);
  
  // Just update the scroll indicator when streaming completes
  useEffect(() => {
    if (!isStreaming && lastMessageCount < messages.length) {
      checkIfUserAtBottom();
    }
  }, [isStreaming, messages.length, lastMessageCount]);
  
  // Update reasoning data for messages when they're added or changed
  useEffect(() => {
    // Create a local copy to track modified messages
    let hasModifiedMessages = false;
    
    // Process messages to extract reasoning
    messages.forEach(message => {
      if (!message.is_user) {
        // Check if this message contains reasoning
        const { text, reasoning } = extractReasoning(message.content);
        
        if (reasoning) {
          // Store reasoning data for this message (or update if already exists)
          setReasoningData(prev => {
            const newMap = new Map(prev);
            // If we already have reasoning data, preserve visibility state
            const existingData = prev.get(message.id);
            newMap.set(message.id, { 
              content: reasoning, 
              visible: existingData ? existingData.visible : false // Default to hidden for new items
            });
            return newMap;
          });
          
          // Update the message content to remove the reasoning comment
          if (message.content !== text) {
            message.content = text;
            hasModifiedMessages = true;
            console.log(`Modified message ${message.id.substring(0, 8)} to remove reasoning comment`);
          }
        }
      }
    });
    
    // Log summary
    if (hasModifiedMessages) {
      console.log("Completed processing messages - removed reasoning tags from content");
    }
  }, [messages]);
  
  // Toggle reasoning visibility
  const toggleReasoning = (messageId: string) => {
    setReasoningData(prev => {
      const newMap = new Map(prev);
      const messageData = newMap.get(messageId);
      
      if (messageData) {
        newMap.set(messageId, { ...messageData, visible: !messageData.visible });
      }
      
      return newMap;
    });
  };
  
  // Toggle streaming reasoning visibility
  const toggleStreamingReasoning = () => {
    setShowStreamingReasoning(prev => !prev);
  };
  
  // Initialize the streaming reasoning visibility state to be hidden by default
  useEffect(() => {
    setShowStreamingReasoning(false);
  }, []);
  
  // Toggle the model dropdown
  const toggleModelDropdown = () => {
    if (!isStreamingState) {
      setIsModelDropdownOpen(!isModelDropdownOpen);
    }
  };
  
  // Handle model selection
  const handleModelSelect = (model: Model) => {
    if (setSelectedModel) {
      setSelectedModel(model);
    }
    setIsModelDropdownOpen(false);
  };

  return (
    <div className={`flex flex-col h-full ${simplified ? 'relative pb-4' : ''}`}>
      {/* Style tag for custom animations */}
      <style>{pulseAnimation}</style>
    
      {/* Back navigation */}
      <button 
        onClick={onBackClick}
        className="pl-12 pt-3 pb-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M15 18l-6-6 6-6" />
        </svg>
        <span className="underline">Back to all chats</span>
      </button>
      
      {/* Message display area */}
      <div 
        ref={messageContainerRef}
        className={`flex-1 overflow-y-auto ${simplified ? 'overflow-x-hidden' : ''} pt-4 px-4 ${simplified ? '' : 'pb-24'} relative scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent ${simplified ? 'max-h-[calc(100%-120px)]' : ''}`}
      >
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-8 ${message.is_user ? "text-right" : "text-left"}`}
            >
              {message.is_user ? (
                <div className="inline-block bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-left">
                  <p>{message.content}</p>
                </div>
              ) : (
                <div className="prose prose-gray dark:prose-invert max-w-none">
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
                  
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleCopyCode(message.content)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm flex items-center"
                    >
                      {copiedText === message.content ? (
                        <>
                          <CheckIcon size={16} className="mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <ClipboardIcon size={16} className="mr-1" />
                          Copy
                        </>
                      )}
                    </button>
                    
                    {/* Only show reasoning toggle if there's reasoning data for this message */}
                    {reasoningData.has(message.id) && (
                      <button
                        onClick={() => toggleReasoning(message.id)}
                        className={`text-sm flex items-center ml-4 ${
                          reasoningData.get(message.id)?.visible 
                            ? 'text-blue-500 dark:text-blue-400' 
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                      >
                        <BrainCircuit size={16} className="mr-1" />
                        {reasoningData.get(message.id)?.visible ? 'Hide reasoning' : 'Show reasoning'}
                      </button>
                    )}
                  </div>
                  
                  {/* Reasoning content display */}
                  {reasoningData.get(message.id)?.visible && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md">
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">AI Reasoning:</h4>
                      <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {reasoningData.get(message.id)?.content}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && streamingContent && (
            <div className="mb-8 text-left">
              <div className="prose prose-gray dark:prose-invert max-w-none">
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
                
                {/* Streaming reasoning toggle (only if there is reasoning) */}
                {streamingReasoning && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={toggleStreamingReasoning}
                      className={`text-sm flex items-center ${
                        showStreamingReasoning 
                          ? 'text-blue-500 dark:text-blue-400' 
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                    >
                      <BrainCircuit size={16} className="mr-1" />
                      {showStreamingReasoning ? 'Hide reasoning' : 'Show reasoning'}
                    </button>
                  </div>
                )}
                
                {/* Streaming reasoning content display */}
                {streamingReasoning && showStreamingReasoning && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">AI Reasoning:</h4>
                    <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {streamingReasoning}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* This div serves as an anchor for scrolling to the bottom with dynamic height */}
          <div 
            ref={messagesEndRef} 
            style={{ height: `${endSpacerHeight}px` }}
            className="transition-height duration-300" 
          />
        </div>

        {/* Scroll to bottom button - only shows when not at bottom */}
        {showScrollBottom && (
          <button 
            onClick={() => scrollToBottom()}
            className={`${simplified ? 'absolute' : 'fixed'} bottom-24 right-4 md:right-8 z-10 p-3 bg-gray-800 dark:bg-gray-200 text-white dark:text-black rounded-full shadow-md hover:bg-gray-700 dark:hover:bg-gray-300 transition-all duration-200 flex items-center justify-center pulse-animation`}
            aria-label="Scroll to bottom"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        )}
      </div>

      {/* Chat input area */}
      <form
        onSubmit={handleSendMessage}
        className={`${simplified ? 'absolute' : 'fixed'} bottom-4 w-full px-4 transition-all duration-300 ${
          simplified 
            ? 'left-0 right-0 mx-auto'
            : (sidebarOpen 
              ? 'left-[var(--sidebar-width)] right-0 max-w-3xl mx-auto' 
              : 'left-0 right-0 max-w-3xl mx-auto')
        }`}
      >
        <div className="backdrop-blur-md rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-4 bg-transparent outline-none resize-none min-h-[56px] max-h-[25vh] overflow-y-auto"
              disabled={isStreamingState}
              rows={1}
              onInput={autoResizeTextarea}
              onFocus={autoResizeTextarea}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (inputMessage.trim() && !isStreamingState) {
                    handleSendMessage(e);
                  }
                }
              }}
            />
          </div>
          <div className="flex items-center px-4 py-2 justify-between">
            <div className="space-x-2 flex items-center">
              {/* Model selector dropdown - Sleek, minimal, opens upward */}
              <div className="relative">
                <Tooltip
                  content="Allows the model to reason about it's response"
                  title={
                    isCodingQuestion
                      ? "Model Selected: Reasoning"
                      : "Model Selected: Normal"
                  }
                >
                  <button
                    type="button"
                    onClick={toggleModelDropdown}
                    disabled={isStreamingState}
                    className={`
                      flex h-8 items-center justify-between
                      rounded-full border p-1 px-3
                      text-[13px] font-medium
                      border-gray-200 dark:border-gray-700
                      transition-colors
                      ${isStreamingState ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"}
                    `}
                    aria-expanded={isModelDropdownOpen}
                    aria-haspopup="true"
                  >
                    <span className="mr-1">{MODEL_DISPLAY_NAMES[selectedModel]}</span>
                    <ChevronDown size={12} className={`transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </Tooltip>
                
                {isModelDropdownOpen && (
                  <div className="absolute z-10 bottom-full mb-1 left-0 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 text-sm min-w-[120px]">
                    <ul role="menu" aria-orientation="vertical" aria-labelledby="model-menu">
                      {Object.entries(MODELS).map(([key, value]) => (
                        <li key={key}>
                          <button
                            type="button"
                            className={`
                              w-full text-left px-3 py-1.5
                              ${value === selectedModel ? 'bg-gray-50 dark:bg-gray-700' : ''} 
                              hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                            `}
                            onClick={() => handleModelSelect(value)}
                          >
                            {MODEL_DISPLAY_NAMES[value]}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 items-center justify-end">
              <button
                type="submit"
                disabled={!inputMessage.trim() || isStreamingState}
                className="p-2 bg-black text-white dark:bg-white dark:text-black rounded-full disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm cursor-pointer"
              >
                {isStreamingState ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-white dark:border-black"></div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatView; 