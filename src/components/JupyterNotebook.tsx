
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { cn } from '@/lib/utils';

export interface CodeCell {
  id: string;
  code: string;
  output: string[];
  isRunning: boolean;
  executionCount: number | null;
  cellType: 'code' | 'markdown';
}

interface JupyterNotebookProps {
  cells: CodeCell[];
  onCellsChange: (cells: CodeCell[]) => void;
  onRunCell: (cellId: string, code: string) => Promise<void>;
  isConnected: boolean;
}

const JupyterNotebook: React.FC<JupyterNotebookProps> = ({
  cells,
  onCellsChange,
  onRunCell,
  isConnected
}) => {
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  const addCell = (index?: number) => {
    const newCell: CodeCell = {
      id: `cell-${Date.now()}`,
      code: '',
      output: [],
      isRunning: false,
      executionCount: null,
      cellType: 'code'
    };

    const newCells = [...cells];
    const insertIndex = index !== undefined ? index + 1 : newCells.length;
    newCells.splice(insertIndex, 0, newCell);
    onCellsChange(newCells);
    setSelectedCellId(newCell.id);
  };

  const deleteCell = (cellId: string) => {
    if (cells.length <= 1) return; // Keep at least one cell
    const newCells = cells.filter(cell => cell.id !== cellId);
    onCellsChange(newCells);
  };

  const updateCellCode = (cellId: string, code: string) => {
    const newCells = cells.map(cell =>
      cell.id === cellId ? { ...cell, code } : cell
    );
    onCellsChange(newCells);
  };

  const moveCellUp = (index: number) => {
    if (index === 0) return;
    const newCells = [...cells];
    [newCells[index], newCells[index - 1]] = [newCells[index - 1], newCells[index]];
    onCellsChange(newCells);
  };

  const moveCellDown = (index: number) => {
    if (index === cells.length - 1) return;
    const newCells = [...cells];
    [newCells[index], newCells[index + 1]] = [newCells[index + 1], newCells[index]];
    onCellsChange(newCells);
  };

  const handleRunCell = async (cell: CodeCell) => {
    if (!cell.code.trim()) return;
    await onRunCell(cell.id, cell.code);
  };

  // Initialize with one cell if empty
  useEffect(() => {
    if (cells.length === 0) {
      addCell();
    }
  }, []);

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-editor-text">Python Notebook</h2>
        <div className="flex items-center space-x-2">
          <div className={cn(
            "px-2 py-1 rounded text-xs",
            isConnected ? "bg-green-600" : "bg-yellow-600"
          )}>
            {isConnected ? "Connected" : "Offline"}
          </div>
          <Button
            size="sm"
            onClick={() => addCell()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Cell
          </Button>
        </div>
      </div>

      {cells.map((cell, index) => (
        <Card
          key={cell.id}
          className={cn(
            "border border-editor-border bg-editor-sidebar",
            selectedCellId === cell.id && "ring-2 ring-blue-500"
          )}
          onClick={() => setSelectedCellId(cell.id)}
        >
          <div className="p-2 border-b border-editor-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-editor-text-muted">
                [{cell.executionCount || ' '}]:
              </span>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRunCell(cell);
                  }}
                  disabled={cell.isRunning}
                  className="h-6 px-2"
                >
                  <Play className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    addCell(index);
                  }}
                  className="h-6 px-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                {cells.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCell(cell.id);
                    }}
                    className="h-6 px-2 hover:bg-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveCellUp(index);
                  }}
                  disabled={index === 0}
                  className="h-6 px-2"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveCellDown(index);
                  }}
                  disabled={index === cells.length - 1}
                  className="h-6 px-2"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {cell.isRunning && (
              <div className="text-xs text-blue-400">Running...</div>
            )}
          </div>

          <div className="relative">
            <Editor
              height="120px"
              theme="vs-dark"
              language="python"
              value={cell.code}
              onChange={(value) => updateCellCode(cell.id, value || '')}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
                fontSize: 13,
                lineNumbers: 'off',
                folding: false,
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 0,
                glyphMargin: false,
                scrollbar: {
                  vertical: 'hidden',
                  horizontal: 'auto'
                },
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,
                wordWrap: 'on'
              }}
            />
          </div>

          {cell.output.length > 0 && (
            <div className="border-t border-editor-border bg-editor p-3">
              <div className="text-xs text-editor-text-muted mb-1">Output:</div>
              <pre className="text-sm text-editor-text font-mono whitespace-pre-wrap">
                {cell.output.join('\n')}
              </pre>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default JupyterNotebook;
