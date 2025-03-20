import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { ClipboardIcon, CheckIcon } from "lucide-react";
import { ChatMessage } from "../../types/chat";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Tooltip from "../common/Tooltip";

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
  onBackClick: () => void;
  sidebarOpen?: boolean;
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
  onBackClick,
  sidebarOpen,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [endSpacerHeight, setEndSpacerHeight] = useState(64);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

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
    const chatInputHeight = 42; // Approximate height of chat input
    const bufferSpace = 24; // Extra space to ensure comfortable reading
    
    // For small screens, keep it minimal
    const isMobileDevice = window.innerWidth < 768;
    
    // Calculate optimal height
    let newHeight;
    if (contentHeight > containerHeight) {
      // Content overflows, use minimal spacing
      newHeight = chatInputHeight + bufferSpace;
    } else {
      // Content fits, use larger spacing on desktop, smaller on mobile
      newHeight = isMobileDevice ? 64 : 96;
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
  
  // Handle height calculation during streaming without forcing scroll
  useEffect(() => {
    if (isStreaming && streamingContent) {
      // Only calculate spacer height during streaming, don't auto-scroll
      calculateSpacerHeight();
      checkIfUserAtBottom();
    }
  }, [isStreaming, streamingContent]);

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

  return (
    <div className="flex flex-col h-screen">
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
      <div ref={messageContainerRef} className="flex-1 overflow-y-auto pt-4 px-4 pb-24 relative">
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
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
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
                  <button
                    onClick={() => handleCopyCode(message.content)}
                    className="mt-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm flex items-center"
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
                </div>
              )}
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && streamingContent && (
            <div className="mb-8 text-left">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
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
            className="fixed bottom-24 right-4 md:right-8 z-10 p-3 bg-gray-800 dark:bg-gray-200 text-white dark:text-black rounded-full shadow-md hover:bg-gray-700 dark:hover:bg-gray-300 transition-all duration-200 flex items-center justify-center pulse-animation"
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
        className={`fixed bottom-4 w-full px-4 transition-all duration-300 ${
          sidebarOpen 
            ? 'left-[var(--sidebar-width)] right-0 max-w-3xl mx-auto' 
            : 'left-0 right-0 max-w-3xl mx-auto'
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
              {/* Coding Question Toggle Button */}
              <button
                type="button"
                onClick={() => setIsCodingQuestion(!isCodingQuestion)}
                className={`flex h-9 min-w-8 items-center justify-center 
                  rounded-full border p-2 
                  text-[13px] font-medium
                  border-gray-300 focus-visible:outline-black
                  cursor-pointer 
                  ${isCodingQuestion ? "bg-gray-200" : ""}
                  ${!isCodingQuestion ? "hover:bg-gray-100" : ""}
                `}
                aria-pressed={isCodingQuestion}
                aria-label="Toggle coding question"
              >
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <g fill="currentColor" fillRule="nonzero">
                    <path d="M8.06561801,18.9432081 L14.565618,4.44320807 C14.7350545,4.06523433 15.1788182,3.8961815 15.5567919,4.06561801 C15.9032679,4.2209348 16.0741922,4.60676263 15.9697642,4.9611247 L15.934382,5.05679193 L9.43438199,19.5567919 C9.26494549,19.9347657 8.82118181,20.1038185 8.44320807,19.934382 C8.09673215,19.7790652 7.92580781,19.3932374 8.03023576,19.0388753 L8.06561801,18.9432081 L14.565618,4.44320807 L8.06561801,18.9432081 Z M2.21966991,11.4696699 L6.46966991,7.21966991 C6.76256313,6.9267767 7.23743687,6.9267767 7.53033009,7.21966991 C7.79659665,7.48593648 7.8208027,7.90260016 7.60294824,8.19621165 L7.53033009,8.28033009 L3.81066017,12 L7.53033009,15.7196699 C7.8232233,16.0125631 7.8232233,16.4874369 7.53033009,16.7803301 C7.26406352,17.0465966 6.84739984,17.0708027 6.55378835,16.8529482 L6.46966991,16.7803301 L2.21966991,12.5303301 C1.95340335,12.2640635 1.9291973,11.8473998 2.14705176,11.5537883 L2.21966991,11.4696699 L6.46966991,7.21966991 L2.21966991,11.4696699 Z M16.4696699,7.21966991 C16.7359365,6.95340335 17.1526002,6.9291973 17.4462117,7.14705176 L17.5303301,7.21966991 L21.7803301,11.4696699 C22.0465966,11.7359365 22.0708027,12.1526002 21.8529482,12.4462117 L21.7803301,12.5303301 L17.5303301,16.7803301 C17.2374369,17.0732233 16.7625631,17.0732233 16.4696699,16.7803301 C16.2034034,16.5140635 16.1791973,16.0973998 16.3970518,15.8037883 L16.4696699,15.7196699 L20.1893398,12 L16.4696699,8.28033009 C16.1767767,7.98743687 16.1767767,7.51256313 16.4696699,7.21966991 Z"></path>
                  </g>
                </svg>
                <div className="whitespace-nowrap pl-1 pr-1">Code</div>
              </button>

              {/* Note Question Toggle Button */}
              <button
                type="button"
                onClick={() => setIsNoteQuestion(!isNoteQuestion)}
                className={`
                  flex h-9 min-w-8 items-center justify-center 
                  rounded-full border p-2 
                  text-[13px] font-medium
                  border-gray-300 focus-visible:outline-black
                  cursor-pointer
                  ${isNoteQuestion ? "bg-gray-200" : ""}
                  ${!isNoteQuestion ? "hover:bg-gray-100" : ""}
                `}
                aria-pressed={isNoteQuestion}
                aria-label="Toggle note question"
              >
                <svg
                  viewBox="0 0 384 384"
                  xmlns="http://www.w3.org/2000/svg"
                  width={24}
                  height={24}
                  className="w-full h-full"
                >
                  <path
                    d="M329.74,24.26c7.99,7.99,10.94,18.28,11.55,29.33,1.79,32.65-1.41,66.95-.04,99.78-.96,13.25-17.8,16.19-21.69,2.96l-.06-105.69c-1.56-11.04-8.45-15.43-19.08-16.17H70.1c-7.49.4-14.39,4.35-16.88,11.62-1.44,96.73-.68,193.85-.38,290.7,2,7.37,8.52,11.81,15.89,12.61,22.09,2.4,47.76-1.74,70.23.27,10.9,3.36,9.63,20.03-2.04,20.87-23.47-1.64-49.64,2.08-72.78-.05-17.63-1.62-32.08-17.48-33.41-34.84V48.35c1.4-17.89,15.61-32.66,33.37-34.88h243.05c7.64.66,17.22,5.42,22.59,10.79Z"
                    fill="currentColor"
                  />
                  <path
                    d="M100.01,82.01c1.82-1.82,5.73-3.2,8.34-3.29l155.27.04c14.1.59,14.86,20.23.76,21.74l-160.54-.72c-7.21-2.59-9.28-12.34-3.83-17.78Z"
                    fill="currentColor"
                  />
                  <path
                    d="M107.84,139.71l155.03-.2c12.54.55,16.12,14.79,5.31,21.05l-162.07,.71c-13.54-2.86-11.56-20.47,1.73-21.56Z"
                    fill="currentColor"
                  />
                  <path
                    d="M104.8,201.17l83.76-.1c11.42,2.61,11.44,18.24,0,20.86l-83.13,.02c-11.14-3.01-11.55-17.09-.63-20.78Z"
                    fill="currentColor"
                  />
                  <path
                    d="M308.08,191.46c36.63-4.12,59.3,37.97,35.44,66.19l-104.32,104.18c-5.19,3.54-32.8,8.13-40.09,8.66-14.99,1.09-25.82-7.35-25.15-22.9.53-12.21,4.78-27.28,7.16-39.33,33.71-37.21,71.03-71.54,106.11-107.64,5.7-4.72,13.41-8.32,20.84-9.16Z"
                    fill="currentColor"
                  />
                </svg>
                <div className="whitespace-nowrap pl-1 pr-1">Notes</div>
              </button>
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