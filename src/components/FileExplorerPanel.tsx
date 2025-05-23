
import React from 'react';
import FileExplorer, { FileNode } from './FileExplorer';
import ServerStatus from './ServerStatus';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface FileExplorerPanelProps {
  files: FileNode[];
  selectedFile: FileNode | null;
  onFileSelect: (file: FileNode) => void;
  selectedLanguage: string;
  isOnline: boolean;
}

const FileExplorerPanel: React.FC<FileExplorerPanelProps> = ({
  files,
  selectedFile,
  onFileSelect,
  selectedLanguage,
  isOnline
}) => {
  return (
    <div className="bg-editor-sidebar border-r border-editor-border h-full flex flex-col">
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Files</h2>
          <Badge className={isOnline ? "bg-blue-600" : "bg-yellow-600"}>
            {isOnline ? "Cloud Storage" : "Local Storage"}
          </Badge>
        </div>
        
        <FileExplorer 
          files={files} 
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
        />
      </div>
      
      <Separator className="bg-editor-border" />
      
      <ServerStatus language={selectedLanguage} isOnline={isOnline} />
    </div>
  );
};

export default FileExplorerPanel;
