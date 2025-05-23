
import React from 'react';
import MonacoEditor from './MonacoEditor';
import { FileNode } from './FileExplorer';

interface EditorPanelProps {
  selectedFile: FileNode | null;
  selectedLanguage: string;
  onEditorChange: (value: string | undefined) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ 
  selectedFile, 
  selectedLanguage, 
  onEditorChange 
}) => {
  return (
    <div className="h-full">
      {selectedFile ? (
        <MonacoEditor 
          file={selectedFile} 
          language={selectedLanguage}
          onChange={onEditorChange}
        />
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
