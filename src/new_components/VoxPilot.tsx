import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCodingQuestion, setIsCodingQuestion] = useState(false);
  const [isNoteQuestion, setIsNoteQuestion] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Sample messages
  const [messages, setMessages] = useState([
    { id: 1, sender: 'user', content: 'How do I create a React component with state?' },
    { id: 2, sender: 'assistant', content: 'Creating a React component with state is straightforward with hooks. Here\'s a simple example:' },
    { id: 3, sender: 'assistant', content: 'Use the useState hook to add state to your functional component:\n\n```jsx\nimport React, { useState } from \'react\';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n```' },
    { id: 4, sender: 'user', content: 'Can you explain the useEffect hook?' },
    { id: 5, sender: 'assistant', content: 'The useEffect hook lets you perform side effects in functional components. It runs after render and after every update by default.' },
    { id: 6, sender: 'assistant', content: 'Here\'s a basic example:\n\n```jsx\nimport React, { useState, useEffect } from \'react\';\n\nfunction Example() {\n  const [count, setCount] = useState(0);\n\n  // Similar to componentDidMount and componentDidUpdate\n  useEffect(() => {\n    // Update the document title using the browser API\n    document.title = `You clicked ${count} times`;\n  });\n\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n```' }
  ]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isStreaming) {
      // Add user message
      const newUserMessage = {
        id: messages.length + 1,
        sender: 'user',
        content: inputMessage
      };
      setMessages([...messages, newUserMessage]);
      setInputMessage('');
      
      // Simulate assistant response after a short delay
      setIsStreaming(true);
      setTimeout(() => {
        const newAssistantMessage = {
          id: messages.length + 2,
          sender: 'assistant',
          content: `I'm responding to your message: "${inputMessage}"`
        };
        setMessages(prevMessages => [...prevMessages, newAssistantMessage]);
        setIsStreaming(false);
      }, 1500);
    }
  };

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

  // Tooltip component
  const Tooltip = ({ content, title, children }) => (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
        {content}
      </div>
    </div>
  );

  // Function to format code blocks in messages
  const formatMessage = (content) => {
    if (!content.includes('```')) return <p>{content}</p>;
    
    const parts = content.split(/```(?:jsx|js|javascript)?\n|```/g);
    let isCode = false;
    
    return parts.map((part, index) => {
      isCode = !isCode;
      if (index === 0) isCode = false;
      
      if (isCode) {
        return (
          <pre key={index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded my-2 overflow-x-auto">
            <code className="text-sm font-mono">{part}</code>
          </pre>
        );
      } else {
        return part.split('\n').map((line, i) => <p key={`${index}-${i}`}>{line}</p>);
      }
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4 py-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.sender === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <div className="prose dark:prose-invert">
                  {formatMessage(message.content)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Chat bar */}
      <div className="px-4 pb-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative">
            <div className="backdrop-blur-md rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-4 bg-transparent outline-none text-gray-800 dark:text-gray-200 resize-none min-h-[56px] max-h-[25vh] overflow-y-auto"
                  disabled={isStreaming}
                  rows={1}
                  onInput={autoResizeTextarea}
                  onFocus={autoResizeTextarea}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (inputMessage.trim() && !isStreaming) {
                        handleSendMessage(e);
                      }
                    }
                  }}
                />
              </div>
              <div className="flex items-center mx-auto px-4 py-4 justify-between">
                <div className="space-x-2 flex items-center relative ml-1">
                  {/* Upload Files Button */}
                  <Tooltip content="Coming Soon">
                    <button
                      aria-disabled="false"
                      aria-label="Upload files and more"
                      className="flex items-center justify-center h-9 rounded-full border border-gray-300 dark:border-gray-600 w-9 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-[18px] w-[18px]"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 3C12.5523 3 13 3.44772 13 4L13 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13L13 13L13 20C13 20.5523 12.5523 21 12 21C11.4477 21 11 20.5523 11 20L11 13L4 13C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11L11 11L11 4C11 3.44772 11.4477 3 12 3Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </button>
                  </Tooltip>
                  
                  {/* Coding Question Toggle Button */}
                  <Tooltip content="Adds code as context" title={isCodingQuestion ? "Coding question: On" : "Coding question: Off"}>
                    <button
                      type="button"
                      onClick={() => setIsCodingQuestion(!isCodingQuestion)}
                      className={`flex h-9 min-w-8 items-center justify-center 
                          rounded-full border p-2 
                          text-[13px] font-medium
                          border-gray-300 dark:border-gray-600 focus-visible:outline-black dark:focus-visible:outline-white
                          cursor-pointer 
                          ${isCodingQuestion ? "bg-gray-200 dark:bg-gray-700" : ""}
                          ${!isCodingQuestion ? "hover:bg-gray-100 dark:hover:bg-gray-800" : ""}
                      `}
                      aria-pressed={isCodingQuestion}
                      aria-label="Toggle coding question"
                    >
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <g fill="currentColor" fillRule="nonzero">
                          <path d="M8.06561801,18.9432081 L14.565618,4.44320807 C14.7350545,4.06523433 15.1788182,3.8961815 15.5567919,4.06561801 C15.9032679,4.2209348 16.0741922,4.60676263 15.9697642,4.9611247 L15.934382,5.05679193 L9.43438199,19.5567919 C9.26494549,19.9347657 8.82118181,20.1038185 8.44320807,19.934382 C8.09673215,19.7790652 7.92580781,19.3932374 8.03023576,19.0388753 L8.06561801,18.9432081 L14.565618,4.44320807 L8.06561801,18.9432081 Z M2.21966991,11.4696699 L6.46966991,7.21966991 C6.76256313,6.9267767 7.23743687,6.9267767 7.53033009,7.21966991 C7.79659665,7.48593648 7.8208027,7.90260016 7.60294824,8.19621165 L7.53033009,8.28033009 L3.81066017,12 L7.53033009,15.7196699 C7.8232233,16.0125631 7.8232233,16.4874369 7.53033009,16.7803301 C7.26406352,17.0465966 6.84739984,17.0708027 6.55378835,16.8529482 L6.46966991,16.7803301 L2.21966991,12.5303301 C1.95340335,12.2640635 1.9291973,11.8473998 2.14705176,11.5537883 L2.21966991,11.4696699 L6.46966991,7.21966991 L2.21966991,11.4696699 Z M16.4696699,7.21966991 C16.7359365,6.95340335 17.1526002,6.9291973 17.4462117,7.14705176 L17.5303301,7.21966991 L21.7803301,11.4696699 C22.0465966,11.7359365 22.0708027,12.1526002 21.8529482,12.4462117 L21.7803301,12.5303301 L17.5303301,16.7803301 C17.2374369,17.0732233 16.7625631,17.0732233 16.4696699,16.7803301 C16.2034034,16.5140635 16.1791973,16.0973998 16.3970518,15.8037883 L16.4696699,15.7196699 L20.1893398,12 L16.4696699,8.28033009 C16.1767767,7.98743687 16.1767767,7.51256313 16.4696699,7.21966991 Z"></path>
                        </g>
                      </svg>
                      <div className="whitespace-nowrap pl-1 pr-1">
                        Code
                      </div>
                    </button>
                  </Tooltip>
                  
                  {/* Note Question Toggle Button */}
                  <Tooltip content="Adds all notes as context" title={isNoteQuestion ? "Note question: On" : "Note question: Off"}>
                    <button
                      type="button"
                      onClick={() => setIsNoteQuestion(!isNoteQuestion)}
                      className={`
                          flex h-9 min-w-8 items-center justify-center 
                          rounded-full border p-2 
                          text-[13px] font-medium
                          border-gray-300 dark:border-gray-600 focus-visible:outline-black dark:focus-visible:outline-white
                          cursor-pointer
                          ${isNoteQuestion ? "bg-gray-200 dark:bg-gray-700" : ""}
                          ${!isNoteQuestion ? "hover:bg-gray-100 dark:hover:bg-gray-800" : ""}
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
                          d="M104.8,201.17l83.76-.1c11.42,2.61,11.44,18.24,0,20.86l-83.13.02c-11.14-3.01-11.55-17.09-.63-20.78Z"
                          fill="currentColor"
                        />
                        <path 
                          d="M308.08,191.46c36.63-4.12,59.3,37.97,35.44,66.19l-104.32,104.18c-5.19,3.54-32.8,8.13-40.09,8.66-14.99,1.09-25.82-7.35-25.15-22.9.53-12.21,4.78-27.28,7.16-39.33,33.71-37.21,71.03-71.54,106.11-107.64,5.7-4.72,13.41-8.32,20.84-9.16Z"
                          fill="currentColor"
                        />
                      </svg>
                      <div className="whitespace-nowrap pl-1 pr-1">
                        Notes
                      </div>
                    </button>
                  </Tooltip>

                  {/* Tool Button */}
                  <Tooltip content="Coming Soon">
                    <button
                      type="button"
                      className="flex h-9 min-w-9 items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 p-1 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Use a tool"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M3 12C3 10.8954 3.89543 10 5 10C6.10457 10 7 10.8954 7 12C7 13.1046 6.10457 14 5 14C3.89543 14 3 13.1046 3 12ZM10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12ZM17 12C17 10.8954 17.8954 10 19 10C20.1046 10 21 10.8954 21 12C21 13.1046 20.1046 14 19 14C17.8954 14 17 13.1046 17 12Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </button>
                  </Tooltip>
                  <Tooltip
                    content="Toggle unused files off"
                    title="For Best Results"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-500 dark:text-gray-400 cursor-help"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </Tooltip>
                </div>
                <div className="flex-shrink-0 items-center justify-end relative z-10 mr-3">
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isStreaming}
                    className="p-2 bg-black text-white dark:bg-white dark:text-black rounded-full disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm cursor-pointer"
                  >
                    {isStreaming ? (
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
      </div>
    </div>
  );
};

export default ChatInterface;