
import React, { useState, useEffect } from 'react';
import MonacoEditor from './MonacoEditor';
import JupyterNotebook, { CodeCell } from './JupyterNotebook';
import { FileNode } from './FileExplorer';

interface EditorPanelProps {
  selectedFile: FileNode | null;
  selectedLanguage: string;
  onEditorChange: (value: string | undefined) => void;
  onRunCode?: (code: string) => Promise<void>;
  isOnline?: boolean;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ 
  selectedFile, 
  selectedLanguage, 
  onEditorChange,
  onRunCode,
  isOnline = false
}) => {
  const [notebookCells, setNotebookCells] = useState<CodeCell[]>([]);

  // Initialize notebook cells from file content
  useEffect(() => {
    if (selectedLanguage === 'python' && selectedFile?.content) {
      try {
        // Try to parse as JSON (notebook format)
        const parsed = JSON.parse(selectedFile.content);
        if (Array.isArray(parsed.cells)) {
          setNotebookCells(parsed.cells);
          return;
        }
      } catch {
        // If not JSON, treat as single code cell
        const cell: CodeCell = {
          id: 'cell-1',
          code: selectedFile.content,
          output: [],
          isRunning: false,
          executionCount: null,
          cellType: 'code'
        };
        setNotebookCells([cell]);
      }
    }
  }, [selectedFile, selectedLanguage]);

  // Save notebook cells back to file
  const handleCellsChange = (cells: CodeCell[]) => {
    setNotebookCells(cells);
    if (selectedLanguage === 'python') {
      const notebookData = {
        cells,
        metadata: {
          kernelspec: {
            display_name: "Python 3",
            language: "python",
            name: "python3"
          }
        }
      };
      onEditorChange(JSON.stringify(notebookData, null, 2));
    }
  };

  const handleRunCell = async (cellId: string, code: string) => {
    if (!onRunCode) return;

    // Update cell to running state
    setNotebookCells(prev => prev.map(cell => 
      cell.id === cellId 
        ? { ...cell, isRunning: true, output: [] }
        : cell
    ));

    try {
      // TODO: Implement proper cell execution
      // This is where we'll connect to the backend for different execution options:
      
      // 1. LOCAL MACHINE EXECUTION:
      // - Will require a local Python kernel/server running on user's machine
      // - Backend endpoint: POST /api/execute/local
      // - Send: { code, cellId, kernelId }
      // - Requires: Local Python installation, jupyter kernel, websocket connection
      
      // 2. EXTERNAL SERVER EXECUTION:
      // - Connect to a dedicated Python execution server
      // - Backend endpoint: POST /api/execute/remote
      // - Send: { code, cellId, sessionId }
      // - Requires: Server with Python environment, container isolation
      
      // 3. THIRD-PARTY SERVICE (Judge0, CodeX, etc.):
      // - Use existing Judge0 integration but enhanced for notebook cells
      // - Backend endpoint: POST /api/execute/judge0
      // - Send: { code, cellId, language_id: 71 }
      // - Requires: API key, rate limiting, proper error handling

      await onRunCode(code);
      
      // For now, simulate execution
      const simulatedOutput = [`Executed: ${code.substring(0, 50)}...`];
      
      setNotebookCells(prev => prev.map(cell => 
        cell.id === cellId 
          ? { 
              ...cell, 
              isRunning: false, 
              output: simulatedOutput,
              executionCount: (cell.executionCount || 0) + 1
            }
          : cell
      ));
    } catch (error) {
      setNotebookCells(prev => prev.map(cell => 
        cell.id === cellId 
          ? { 
              ...cell, 
              isRunning: false, 
              output: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
            }
          : cell
      ));
    }
  };

  return (
    <div className="h-full w-full overflow-hidden flex">
      {selectedFile ? (
        <div className="flex-1 h-full">
          {selectedLanguage === 'python' ? (
            <JupyterNotebook
              cells={notebookCells}
              onCellsChange={handleCellsChange}
              onRunCell={handleRunCell}
              isConnected={isOnline}
            />
          ) : (
            <MonacoEditor 
              file={selectedFile} 
              language={selectedLanguage}
              onChange={onEditorChange}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-editor-text-muted h-full">
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-2">No File Selected</h3>
            <p>Select a file from the explorer to start coding</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPanel;
