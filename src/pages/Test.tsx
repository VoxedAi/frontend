import React, { useState, useRef, useEffect } from 'react';

interface Note {
  id: string;
  title: string;
  preview: string;
}

interface FileItem {
  id: string;
  name: string;
  preview: string;
}

// Sample data
const notesSample: Note[] = [
  { id: '1', title: 'Meeting notes', preview: 'Summary of the weekly meeting...' },
  { id: '2', title: 'Project plan', preview: 'High-level plan for the project...' },
  { id: '3', title: 'Ideas', preview: 'Brainstorming and random thoughts...' },
];

const filesSample: FileItem[] = [
  { id: '1', name: 'index.ts', preview: 'TypeScript entry point...' },
  { id: '2', name: 'App.tsx', preview: 'React component code...' },
  { id: '3', name: 'styles.css', preview: 'CSS stylesheet...' },
];

// Add types for logging and tracking mentions
interface MentionLog {
  type: string;
  fullCommand: string;
  endpoint: string;
}

const mainCommands = [
  { id: 'notes', type: 'list', description: 'Access your notes' },
  { id: 'code', type: 'endpoint', description: 'Execute code' },
  { id: 'files', type: 'list', description: 'Browse files' },
  { id: 'web', type: 'endpoint', description: 'Search the web' }
];

const Test: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);

  const [filteredMainCommands, setFilteredMainCommands] = useState(mainCommands);
  const [activeCommand, setActiveCommand] = useState<string | null>(null);

  const [filteredNotes, setFilteredNotes] = useState(notesSample);
  const [filteredFiles, setFilteredFiles] = useState(filesSample);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);
  
  // Add state for logging mentions
  const [mentionLogs, setMentionLogs] = useState<MentionLog[]>([]);
  
  // Track cursor position to restore it after command selection
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Whenever input changes, check for '@' and update menus accordingly
  useEffect(() => {
    const atIndex = inputValue.lastIndexOf('@');
    if (atIndex >= 0) {
      // There's an '@' somewhere in the text
      const afterAt = inputValue.slice(atIndex + 1).toLowerCase();

      // If we're NOT in a submenu yet, filter main commands
      if (!showSubMenu) {
        const matches = mainCommands.filter(cmd =>
          cmd.id.startsWith(afterAt)
        );
        setFilteredMainCommands(matches);
        setShowMainMenu(true);
      } else {
        // If we ARE in a submenu, filter that submenu's items
        if (activeCommand === 'notes') {
          const query = afterAt.replace('notes', '').trim();
          const newFilteredNotes = notesSample.filter(n =>
            n.title.toLowerCase().includes(query)
          );
          setFilteredNotes(newFilteredNotes);
        } else if (activeCommand === 'files') {
          const query = afterAt.replace('files', '').trim();
          const newFilteredFiles = filesSample.filter(f =>
            f.name.toLowerCase().includes(query)
          );
          setFilteredFiles(newFilteredFiles);
        }
      }
    } else {
      // No '@' in text => no menus
      setShowMainMenu(false);
      setShowSubMenu(false);
      setActiveCommand(null);
    }
  }, [inputValue, showSubMenu, activeCommand]);

  // Restore cursor position after input value changes
  useEffect(() => {
    if (inputRef.current && selectionStart !== null && selectionEnd !== null) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(selectionStart, selectionEnd);
      // Reset after applying
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [selectionStart, selectionEnd]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Reset selection indices whenever the text changes
    setSelectedIndex(0);
    setSelectedSubIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMainMenu && !showSubMenu) {
      // Navigating the MAIN menu
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredMainCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredMainCommands.length) % filteredMainCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectMainCommand(filteredMainCommands[selectedIndex].id);
      } else if (e.key === 'Escape') {
        setShowMainMenu(false);
      }
    } else if (showSubMenu && activeCommand === 'notes') {
      // Navigating the NOTES submenu
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSubIndex(prev => (prev + 1) % filteredNotes.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSubIndex(prev => (prev - 1 + filteredNotes.length) % filteredNotes.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectNote(filteredNotes[selectedSubIndex]);
      } else if (e.key === 'Escape') {
        // Back to main menu
        setShowSubMenu(false);
        setShowMainMenu(true);
      }
    } else if (showSubMenu && activeCommand === 'files') {
      // Navigating the FILES submenu
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSubIndex(prev => (prev + 1) % filteredFiles.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSubIndex(prev => (prev - 1 + filteredFiles.length) % filteredFiles.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectFile(filteredFiles[selectedSubIndex]);
      } else if (e.key === 'Escape') {
        // Back to main menu
        setShowSubMenu(false);
        setShowMainMenu(true);
      }
    }
  };

  // Save cursor position before modifying the input
  const saveCursorPosition = (atIndex: number, newTextLength: number) => {
    const cursorPos = atIndex + newTextLength;
    setSelectionStart(cursorPos);
    setSelectionEnd(cursorPos);
  };

  // User clicks or presses Enter on a main command
  const selectMainCommand = (cmd: string) => {
    // Replace the '@...' text in input with the chosen command
    const atIndex = inputValue.lastIndexOf('@');
    
    setActiveCommand(cmd);
    setShowMainMenu(false);

    // If command is notes/files => open submenu
    // If command is code/web => just treat it as a toggle and log it
    if (cmd === 'notes' || cmd === 'files') {
      setShowSubMenu(true);
      // For list type, just keep the @ marker for further selection
      const newValue = inputValue.slice(0, atIndex) + `@${cmd} `;
      setInputValue(newValue);
      saveCursorPosition(atIndex, cmd.length + 2); // +2 for @ and space
    } else {
      setShowSubMenu(false);
      // For endpoint type, replace the @cmd with just the endpoint
      const newValue = inputValue.slice(0, atIndex) + `@${cmd}`;
      setInputValue(newValue);
      saveCursorPosition(atIndex, cmd.length + 1); // +1 for @
      
      // Log the endpoint command (code/web)
      const fullCommand = `@${cmd}`;
      const endpoint = cmd;
      logMention(cmd, fullCommand, endpoint);
    }
  };

  // User clicks or presses Enter on a note item
  const selectNote = (note: Note) => {
    const atIndex = inputValue.lastIndexOf('@notes');
    // Everything before the '@notes' portion
    const prefix = inputValue.slice(0, atIndex);
    // Replace @notes with just the note title
    const newValue = prefix + `@${note.title}`;
    setInputValue(newValue);
    saveCursorPosition(atIndex, note.title.length + 1); // +1 for @
    
    // Log the note selection
    const fullCommand = `@notes ${note.title}`;
    const endpoint = note.title;
    logMention('notes', fullCommand, endpoint);
    
    closeSubmenu();
  };

  // User clicks or presses Enter on a file item
  const selectFile = (file: FileItem) => {
    const atIndex = inputValue.lastIndexOf('@files');
    // Everything before the '@files' portion
    const prefix = inputValue.slice(0, atIndex);
    // Replace @files with just the filename
    const newValue = prefix + `@${file.name}`;
    setInputValue(newValue);
    saveCursorPosition(atIndex, file.name.length + 1); // +1 for @
    
    // Log the file selection
    const fullCommand = `@files ${file.name}`;
    const endpoint = file.name;
    logMention('files', fullCommand, endpoint);
    
    closeSubmenu();
  };

  // Function to log mentions
  const logMention = (type: string, fullCommand: string, endpoint: string) => {
    const newLog: MentionLog = {
      type,
      fullCommand,
      endpoint
    };
    setMentionLogs(prev => [...prev, newLog]);
    console.log(`Mention logged: ${type}.${endpoint} (Full Command: ${fullCommand})`);
  };

  // Close out the submenu entirely
  const closeSubmenu = () => {
    setShowSubMenu(false);
    setActiveCommand(null);
  };

  // Handlers for clicks
  const handleMainCommandClick = (cmd: string) => {
    selectMainCommand(cmd);
  };

  const handleNoteClick = (note: Note) => {
    selectNote(note);
  };

  const handleFileClick = (file: FileItem) => {
    selectFile(file);
  };

  // Get a CSS class for a command in the text
  const getCommandClass = (text: string) => {
    // Commands are always prefixed with @
    const commandRegex = /@(\w+)/g;
    let match;
    let lastMatch = null;
    
    while ((match = commandRegex.exec(text)) !== null) {
      lastMatch = match;
    }
    
    // If we have a command match, return special styling
    if (lastMatch) {
      return {
        backgroundColor: '#f0f0ff',
        fontWeight: 'bold',
        borderRadius: '2px'
      };
    }
    
    return {};
  };

  return (
    <div style={{ position: 'relative', width: 400, margin: '2rem auto' }}>
      <div
        style={{ 
          width: '100%', 
          position: 'relative'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          style={{ 
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            minHeight: '38px',
            outline: 'none',
            ...(inputValue.includes('@') ? getCommandClass(inputValue) : {})
          }}
        />
      </div>

      {/* MAIN MENU */}
      {showMainMenu && (
        <div
          style={{
            position: 'absolute',
            top: 42,
            left: 0,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 4,
            width: 250,
            zIndex: 100,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
        >
          {filteredMainCommands.map((cmd, index) => (
            <div
              key={cmd.id}
              onClick={() => handleMainCommandClick(cmd.id)}
              style={{
                padding: '10px',
                background: index === selectedIndex ? '#f5f5f5' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #eee'
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold' }}>{cmd.id}</div>
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  {cmd.description}
                </div>
              </div>
              <span style={{ 
                fontSize: '0.7em', 
                padding: '2px 6px', 
                borderRadius: '12px', 
                background: cmd.type === 'list' ? '#e3f2fd' : '#e8f5e9',
                color: cmd.type === 'list' ? '#1565c0' : '#2e7d32'
              }}>
                {cmd.type}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* SUBMENU for NOTES */}
      {showSubMenu && activeCommand === 'notes' && (
        <div
          style={{
            position: 'absolute',
            top: 42,
            left: 0,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 4,
            width: 300,
            zIndex: 100,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
        >
          {/* Back button */}
          <div
            style={{
              padding: '8px',
              cursor: 'pointer',
              background: '#f0f0f0',
              borderBottom: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={() => {
              setShowSubMenu(false);
              setShowMainMenu(true);
            }}
          >
            <span style={{ marginRight: '5px' }}>&larr;</span> 
            <span>Back to commands</span>
            <span style={{ 
              marginLeft: 'auto', 
              fontSize: '0.7em', 
              padding: '2px 6px', 
              borderRadius: '12px', 
              background: '#e3f2fd',
              color: '#1565c0'
            }}>
              note items
            </span>
          </div>
          {filteredNotes.map((note, index) => (
            <div
              key={note.id}
              onClick={() => handleNoteClick(note)}
              style={{
                padding: '10px',
                background: index === selectedSubIndex ? '#f5f5f5' : '#fff',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{note.title}</div>
              <div style={{ fontSize: '0.8em', color: '#666' }}>{note.preview}</div>
            </div>
          ))}
        </div>
      )}

      {/* SUBMENU for FILES */}
      {showSubMenu && activeCommand === 'files' && (
        <div
          style={{
            position: 'absolute',
            top: 42,
            left: 0,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 4,
            width: 300,
            zIndex: 100,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
        >
          {/* Back button */}
          <div
            style={{
              padding: '8px',
              cursor: 'pointer',
              background: '#f0f0f0',
              borderBottom: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={() => {
              setShowSubMenu(false);
              setShowMainMenu(true);
            }}
          >
            <span style={{ marginRight: '5px' }}>&larr;</span> 
            <span>Back to commands</span>
            <span style={{ 
              marginLeft: 'auto', 
              fontSize: '0.7em', 
              padding: '2px 6px', 
              borderRadius: '12px', 
              background: '#e3f2fd',
              color: '#1565c0'
            }}>
              file items
            </span>
          </div>
          {filteredFiles.map((file, index) => (
            <div
              key={file.id}
              onClick={() => handleFileClick(file)}
              style={{
                padding: '10px',
                background: index === selectedSubIndex ? '#f5f5f5' : '#fff',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{file.name}</div>
              <div style={{ fontSize: '0.8em', color: '#666' }}>{file.preview}</div>
            </div>
          ))}
        </div>
      )}

      {/* Log Display */}
      {mentionLogs.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          border: '1px solid #ddd', 
          borderRadius: '4px',
          padding: '10px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Mention Logs:</h3>
          {mentionLogs.map((log, index) => (
            <div key={index} style={{ 
              padding: '8px', 
              borderBottom: index < mentionLogs.length - 1 ? '1px solid #eee' : 'none',
              display: 'flex', 
              justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: 'bold' }}>{log.type}.{log.endpoint}</span>
              <span style={{ color: '#666' }}>{log.fullCommand}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Test;
