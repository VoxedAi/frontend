import React from "react";

interface PilotInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isStreaming: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  autoResizeTextarea: () => void;
  isCodingQuestion: boolean;
  setIsCodingQuestion: (value: boolean) => void;
  isNoteQuestion: boolean;
  setIsNoteQuestion: (value: boolean) => void;
}

/**
 * PilotInput - A simplified message input component for VoxPilot
 */
const PilotInput: React.FC<PilotInputProps> = ({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  isStreaming,
  textareaRef,
  autoResizeTextarea,
  isCodingQuestion,
  setIsCodingQuestion,
  isNoteQuestion,
  setIsNoteQuestion,
}) => {
  return (
    <div className="px-2 pb-2 lg:px-4 lg:pb-4">
      <form onSubmit={handleSendMessage} className="relative">
        <div className="backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask Vox Pilot..."
              className="flex-1 p-2 lg:p-3 bg-transparent outline-none text-gray-800 dark:text-gray-200 resize-none min-h-[40px] max-h-[20vh] overflow-y-auto text-sm"
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
          <div className="flex items-center mx-auto px-2 py-1 lg:px-3 lg:py-2 justify-between">
            <div className="space-x-1 flex items-center relative">
              {/* Toggle for code context */}
              <button
                type="button"
                onClick={() => setIsCodingQuestion(!isCodingQuestion)}
                className={`flex h-7 min-w-6 items-center justify-center 
                    rounded-full border p-1 
                    text-xs font-medium
                    border-gray-300 dark:border-gray-600
                    ${isCodingQuestion ? "bg-gray-200 dark:bg-gray-700" : ""}
                    ${!isCodingQuestion ? "hover:bg-gray-100 dark:hover:bg-gray-800" : ""}
                `}
                aria-pressed={isCodingQuestion}
                aria-label="Toggle coding question"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="scale-75">
                  <g fill="currentColor" fillRule="nonzero">
                    <path d="M8.06561801,18.9432081 L14.565618,4.44320807 C14.7350545,4.06523433 15.1788182,3.8961815 15.5567919,4.06561801 C15.9032679,4.2209348 16.0741922,4.60676263 15.9697642,4.9611247 L15.934382,5.05679193 L9.43438199,19.5567919 C9.26494549,19.9347657 8.82118181,20.1038185 8.44320807,19.934382 C8.09673215,19.7790652 7.92580781,19.3932374 8.03023576,19.0388753 L8.06561801,18.9432081 L14.565618,4.44320807 L8.06561801,18.9432081 Z M2.21966991,11.4696699 L6.46966991,7.21966991 C6.76256313,6.9267767 7.23743687,6.9267767 7.53033009,7.21966991 C7.79659665,7.48593648 7.8208027,7.90260016 7.60294824,8.19621165 L7.53033009,8.28033009 L3.81066017,12 L7.53033009,15.7196699 C7.8232233,16.0125631 7.8232233,16.4874369 7.53033009,16.7803301 C7.26406352,17.0465966 6.84739984,17.0708027 6.55378835,16.8529482 L6.46966991,16.7803301 L2.21966991,12.5303301 C1.95340335,12.2640635 1.9291973,11.8473998 2.14705176,11.5537883 L2.21966991,11.4696699 L6.46966991,7.21966991 L2.21966991,11.4696699 Z M16.4696699,7.21966991 C16.7359365,6.95340335 17.1526002,6.9291973 17.4462117,7.14705176 L17.5303301,7.21966991 L21.7803301,11.4696699 C22.0465966,11.7359365 22.0708027,12.1526002 21.8529482,12.4462117 L21.7803301,12.5303301 L17.5303301,16.7803301 C17.2374369,17.0732233 16.7625631,17.0732233 16.4696699,16.7803301 C16.2034034,16.5140635 16.1791973,16.0973998 16.3970518,15.8037883 L16.4696699,15.7196699 L20.1893398,12 L16.4696699,8.28033009 C16.1767767,7.98743687 16.1767767,7.51256313 16.4696699,7.21966991 Z"></path>
                  </g>
                </svg>
              </button>
              
              {/* Toggle for note context */}
              <button
                type="button"
                onClick={() => setIsNoteQuestion(!isNoteQuestion)}
                className={`
                    flex h-7 min-w-6 items-center justify-center 
                    rounded-full border p-1 
                    text-xs font-medium
                    border-gray-300 dark:border-gray-600
                    ${isNoteQuestion ? "bg-gray-200 dark:bg-gray-700" : ""}
                    ${!isNoteQuestion ? "hover:bg-gray-100 dark:hover:bg-gray-800" : ""}
                `}
                aria-pressed={isNoteQuestion}
                aria-label="Toggle note question"
              >
                <svg 
                  viewBox="0 0 384 384" 
                  xmlns="http://www.w3.org/2000/svg"
                  width={16}
                  height={16}
                  className="scale-75"
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
              </button>
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
              className="p-1 bg-black text-white dark:bg-white dark:text-black rounded-full disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm cursor-pointer"
            >
              {isStreaming ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white dark:border-black"></div>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PilotInput; 