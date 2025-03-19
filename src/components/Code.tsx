import { SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackPreview, SandpackConsole, UnstyledOpenInCodeSandboxButton, useSandpack } from "@codesandbox/sandpack-react";
import { useState, useEffect } from "react";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { githubLight, atomDark } from "@codesandbox/sandpack-themes";
import { FaColumns, FaChevronDown, FaEyeSlash } from "react-icons/fa";
import { python } from "@codemirror/lang-python";

// Types
type SandpackLayoutMode = "preview" | "tests" | "console";
type ConsoleLayoutMode = "side-by-side" | "below" | "collapsed";

export default function Sandbox() {
  const theme = 'light';
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [layoutMode, setLayoutMode] = useState("preview");
  const [consoleLayout, setConsoleLayout] = useState("collapsed");
  const [codeExecutionResult, setCodeExecutionResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // Available languages
  const languages = [
    {
      name: "python",
      extensions: ["py"],
      language: python(),
    }
    // Add other languages as needed
  ];
  
  // Get files based on selected language - you'll need to define or import this
  const files = {
    "/App.py": {
      code: "# Your Python code here\n\nprint('Hello, World!')\n\n# Define a function\ndef greet(name):\n    return f'Hello, {name}!'\n\n# Test the function\nresult = greet('User')\nprint(result)",
    },
  };
  
  // When Python is selected, force the layout mode to be console
  useEffect(() => {
    if (selectedLanguage === "python") {
      setLayoutMode("console");
    }
  }, [selectedLanguage]);

  // Console layout toggle handler
  const toggleConsoleLayout = () => {
    const layouts = ["below", "side-by-side", "collapsed"];
    const currentIndex = layouts.indexOf(consoleLayout);
    const nextIndex = (currentIndex + 1) % layouts.length;
    setConsoleLayout(layouts[nextIndex]);
  };

  // Function to automatically show console when running code
  const toggleConsoleLayoutRunButton = () => {
    if (consoleLayout === "collapsed") {
      toggleConsoleLayout();
    }
  };

  // Function to get icon based on current layout
  const getConsoleLayoutIcon = () => {
    switch (consoleLayout) {
      case "side-by-side":
        return <FaColumns className="mr-1" />;
      case "below":
        return <FaChevronDown className="mr-1" />;
      case "collapsed":
        return <FaEyeSlash className="mr-1" />;
    }
  };

  // Function to get label text for the layout toggle button
  const getConsoleLayoutLabel = () => {
    switch (consoleLayout) {
      case "below":
        return "Below";
      case "side-by-side":
        return "Side";
      case "collapsed":
        return "Hidden";
    }
  };

  // Function to get tooltip text for the layout toggle button
  const getConsoleLayoutTooltip = () => {
    switch (consoleLayout) {
      case "side-by-side":
        return "Switch to console below";
      case "below":
        return "Hide console";
      case "collapsed":
        return "Show console side-by-side";
    }
  };

  // Create a custom theme that adapts to the current theme
  const customTheme = {
    ...(theme === "dark" ? atomDark : githubLight),
    colors: {
      ...(theme === "dark" ? atomDark.colors : githubLight.colors),
      surface1: theme === 'dark' ? '#212121' : '#ffffff',
      surface2: theme === 'dark' ? '#333333' : '#f5f5f5',
      surface3: theme === 'dark' ? '#404040' : '#e5e5e5',
      clickable: theme === 'dark' ? '#aaaaaa' : '#808080',
      base: theme === 'dark' ? '#ffffff' : '#000000',
      disabled: theme === 'dark' ? '#4d4d4d' : '#cccccc',
      hover: theme === 'dark' ? '#2d2d2d' : '#eaeaea',
      accent: '#6c47ff',
    }
  };

  return (
    <div className="flex flex-col h-full w-full gap-2 py-2 px-2 bg-white max-h-full overflow-hidden">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <label htmlFor="language-select" className="text-sm text-adaptive font-medium">
            Language:
          </label>
          <select
            id="language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-2 py-1 text-sm rounded-md bg-background text-adaptive border-adaptive hover:bg-hover transition-colors focus:outline-none focus:ring-1 ring-adaptive cursor-pointer"
          >
            {languages.map((language) => (
              <option key={language.name} value={language.name}>
                {language.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Only show view options if language is not Python */}
            {selectedLanguage !== "python" ? (
              <>
                <label htmlFor="view-select" className="text-sm text-adaptive font-medium">
                  View:
                </label>
                <select
                  id="view-select"
                  value={layoutMode}
                  onChange={(e) => setLayoutMode(e.target.value)}
                  className="px-2 py-1 text-sm rounded-md bg-background text-adaptive border-adaptive hover:bg-hover transition-colors focus:outline-none focus:ring-1 ring-adaptive"
                >
                  <option value="preview">Preview</option>
                  <option value="tests">Tests</option>
                  <option value="console">Console</option>
                </select>
              </>
            ) : (
              <div className="text-sm text-adaptive font-medium">
                <span className="text-primary font-medium">Console View</span> (Python)
              </div>
            )}
          </div>
        </div>
      </div>
      
      <SandpackProvider
        theme={customTheme}
        template="react"
        files={files}
        options={{
          classes: {
            "sp-wrapper": "border border-adaptive rounded-lg overflow-hidden",
            "sp-layout": "bg-background",
            "sp-tab-button": "text-adaptive hover:bg-hover",
          },
          initMode: "lazy",
        }}
      >
        {/* Run Button and Console Layout Toggle */}
        <div className="flex justify-between items-center mb-1">
          <div>
            {(selectedLanguage === "python" || layoutMode === "console") && (
              <button
                type="button"
                onClick={toggleConsoleLayout}
                className="inline-flex items-center text-xs justify-center px-2 py-1 rounded-md text-adaptive bg-background hover:bg-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50 transition-all cursor-pointer"
                title={getConsoleLayoutTooltip()}
              >
                {getConsoleLayoutIcon()}
                <span>Console: {getConsoleLayoutLabel()}</span>
              </button>
            )}
          </div>
          <div onClick={() => toggleConsoleLayoutRunButton()}>
            <RunButton 
              setCodeExecutionResult={setCodeExecutionResult} 
              setLayoutMode={setLayoutMode}
              isRunning={isRunning}
              setIsRunning={setIsRunning}
            />
          </div>
        </div>
        
        <SandpackLayout className={`transition-all duration-300 ease-in-out h-full ${consoleLayout === "below" ? "flex-col" : ""}`}>
          <SandpackCodeEditor
            showTabs={true}
            showLineNumbers={true}
            showInlineErrors={true}
            wrapContent={true}
            extensions={[autocompletion()]}
            showRunButton={false} 
            extensionsKeymap={[...completionKeymap]}
            style={{ 
              height: consoleLayout === "below" ? "calc(50% - 1rem)" : "100%",
              flex: consoleLayout === "side-by-side" ? "1 1 49%" : "1 1 auto",
              transition: "height 0.3s ease-in-out, flex 0.3s ease-in-out",
              minHeight: "100px"
            }}
            additionalLanguages={languages}
          />
          {selectedLanguage === "python" && consoleLayout !== "collapsed" && (
            <div 
              className={`overflow-auto bg-background ${consoleLayout === "below" ? "border-t" : "border-l"} border-adaptive transition-all duration-300 ease-in-out`} 
              style={{ 
                height: consoleLayout === "below" ? "calc(50% - 1rem)" : "100%",
                flex: consoleLayout === "side-by-side" ? "1 1 49%" : "1 1 auto",
                transition: "height 0.3s ease-in-out, flex 0.3s ease-in-out",
                minHeight: "100px"
              }}
            >
              <CustomConsoleOutput 
                result={codeExecutionResult} 
                setCodeExecutionResult={setCodeExecutionResult} 
                setLayoutMode={setLayoutMode} 
                isRunning={isRunning} 
                setIsRunning={setIsRunning} 
              />
            </div>
          )}
          {selectedLanguage !== "python" && layoutMode !== "console" && (
            <>
              {layoutMode === "preview" && <SandpackPreview showNavigator={true} />}
              {layoutMode === "tests" && <SandpackPreview showNavigator={false} />}
            </>
          )}
          {selectedLanguage !== "python" && layoutMode === "console" && consoleLayout !== "collapsed" && (
            <div className="flex-1 overflow-auto bg-background border-l border-adaptive">
              <SandpackConsole
                showSyntaxError={true}
                showResetConsoleButton={true}
                showRestartButton={true}
                resetOnPreviewRestart={true}
                showHeader={true}
              />
            </div>
          )}
        </SandpackLayout>
        <div className="flex justify-between items-center p-2">
          <UnstyledOpenInCodeSandboxButton className="text-primary underline px-4 py-2">
              Open in CodeSandbox
          </UnstyledOpenInCodeSandboxButton>
        </div>
      </SandpackProvider>
    </div>
  );
}

// Custom console output component
const CustomConsoleOutput = ({ 
  result, 
  setCodeExecutionResult, 
  setLayoutMode, 
  isRunning, 
  setIsRunning 
}) => {
  
  const renderWithLineNumbers = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    return (
      <div className="relative bg-card">
        <div className="absolute left-0 top-0 px-2 py-3 text-right select-none border-r border-adaptive" style={{ width: '3rem' }}>
          {lines.map((_, i) => (
            <div key={i} className="text-adaptive text-xs pr-1 leading-6 h-6">{i + 1}</div>
          ))}
        </div>
        <div className="pl-16 pr-4 py-3 whitespace-pre-wrap font-mono">
          {lines.map((line, i) => (
            <div key={i} className="leading-6 h-6 text-adaptive">
              {line || '\u00A0'} {/* Use non-breaking space to preserve empty lines */}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!result) {
    return (
      <div className="font-mono text-sm h-full bg-background overflow-auto flex flex-col justify-center items-center">
        <div className="p-4 text-adaptive flex flex-col justify-center items-center space-y-4">
          <p>Run your code to see output here.</p>
          <RunButton 
            setCodeExecutionResult={setCodeExecutionResult} 
            setLayoutMode={setLayoutMode} 
            isRunning={isRunning} 
            setIsRunning={setIsRunning} 
          />
        </div>
      </div>
    );
  }

  // Check if there's an actual code execution error
  const hasExecutionError = result.has_execution_error || (result.stderr && result.stderr.trim().length > 0);
  const hasResult = result.result && Object.keys(result.result || {}).length > 0;
  const hasOutput = result.stdout && result.stdout.trim().length > 0;

  return (
    <div className="font-mono text-sm h-full bg-background overflow-auto">
      <div className="p-4">
        {/* Execution Status Header */}
        <div className={`${hasExecutionError ? "text-red-600" : "text-green-600"} mb-2`}>
          {hasExecutionError ? (
            <>✗ Code execution error</>
          ) : (
            <>✓ Code executed successfully</>
          )}
          {result.execution_time && ` (${result.execution_time.toFixed(4)}s)`}
        </div>
        
        {/* Standard output */}
        {hasOutput && (
          <div className="mb-4">
            <div className="text-adaptive font-semibold mb-1">Output:</div>
            <div className="bg-background rounded-md overflow-auto max-h-96 border border-adaptive">
              {renderWithLineNumbers(result.stdout)}
            </div>
          </div>
        )}
        
        {/* Error output */}
        {hasExecutionError && (
          <div className="mb-4">
            <div className="text-red-600 font-semibold mb-1">Error:</div>
            <div className="bg-red-50 rounded-md overflow-auto max-h-96 border border-red-200">
              {renderWithLineNumbers(result.stderr)}
            </div>
          </div>
        )}
        
        {/* Return values */}
        {hasResult && (
          <div className="mb-4">
            <div className="text-adaptive font-semibold mb-1">Variables:</div>
            <div className="bg-card p-3 rounded-md overflow-auto max-h-80 border border-adaptive">
              <table className="w-full text-left">
                <thead className="border-b border-adaptive">
                  <tr>
                    <th className="pb-2 pr-4 font-semibold text-adaptive">Name</th>
                    <th className="pb-2 font-semibold text-adaptive">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.result || {}).map(([key, value]) => (
                    <tr key={key} className="border-b border-adaptive last:border-0">
                      <td className="py-2 pr-4 text-blue-600">{key}</td>
                      <td className="py-2 text-adaptive">
                        {typeof value === 'object' 
                          ? JSON.stringify(value, null, 2)
                          : String(value)
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Show a message when there's no data to display */}
        {!hasOutput && !hasExecutionError && !hasResult && (
          <div className="text-muted italic">
            No output or variables to display.
          </div>
        )}
      </div>
    </div>
  );
};

// Run button component that has access to Sandpack context
function RunButton({ 
  setCodeExecutionResult, 
  setLayoutMode, 
  isRunning, 
  setIsRunning 
}) {
  const { sandpack } = useSandpack();

  const runCode = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    
    try {
      // Get the current code and language
      const activeFile = sandpack.activeFile;
      const code = sandpack.files[activeFile].code;
      
      // This is a placeholder for actual code execution
      // You'll need to implement executeCode or executeCodeLocally functions
      const result = {
        success: true,
        stdout: "Hello, World!\nHello, User!",
        stderr: "",
        has_execution_error: false,
        execution_time: 0.1,
        result: {
          result: "Hello, User!"
        }
      };
      
      setTimeout(() => {
        setCodeExecutionResult(result);
        setLayoutMode("console");
        setIsRunning(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to run code:", error);
      setCodeExecutionResult({
        success: false,
        stdout: '',
        stderr: `Failed to run code: ${String(error)}`,
        has_execution_error: true
      });
      setLayoutMode("console");
      setIsRunning(false);
    }
  };

  return (
    <button
      onClick={runCode}
      disabled={isRunning}
      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
    >
      {isRunning ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Running...
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          Run Code
        </>
      )}
    </button>
  );
}