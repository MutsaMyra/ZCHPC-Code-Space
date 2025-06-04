
import React from 'react';
import FileExplorer, { FileNode } from './FileExplorer';
import ServerStatus from './ServerStatus';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { fileSystemService } from '../services/fileSystemService';

interface FileExplorerPanelProps {
  files: FileNode[];
  selectedFile: FileNode | null;
  onFileSelect: (file: FileNode) => void;
  onFilesChange: (files: FileNode[]) => void;
  selectedLanguage: string;
  isOnline: boolean;
}

const FileExplorerPanel: React.FC<FileExplorerPanelProps> = ({
  files,
  selectedFile,
  onFileSelect,
  onFilesChange,
  selectedLanguage,
  isOnline
}) => {
  const handleCreateFile = (parentId: string, fileName: string) => {
    const newFile = fileSystemService.createFile(parentId, fileName);
    if (newFile) {
      // Update the files array to reflect the change
      onFilesChange(fileSystemService.getFiles());
    }
  };

  const handleCreateFolder = (parentId: string, folderName: string) => {
    const newFolder: FileNode = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: folderName,
      type: 'folder',
      children: [],
      lastModified: new Date()
    };

    // Add folder to the file system
    const files = fileSystemService.getFiles();
    
    const addFolderToTree = (nodes: FileNode[]): FileNode[] => {
      if (parentId === 'root') {
        return [...nodes, newFolder];
      }
      
      return nodes.map(node => {
        if (node.id === parentId && node.type === 'folder') {
          return {
            ...node,
            children: [...(node.children || []), newFolder]
          };
        } else if (node.children) {
          return {
            ...node,
            children: addFolderToTree(node.children)
          };
        }
        return node;
      });
    };

    const updatedFiles = addFolderToTree(files);
    onFilesChange(updatedFiles);
  };

  return (
    <div className="bg-editor-sidebar border-r border-editor-border h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <Badge className={isOnline ? "bg-blue-600" : "bg-yellow-600"}>
            {isOnline ? "Cloud Storage" : "Local Storage"}
          </Badge>
        </div>
        
        <FileExplorer 
          files={files} 
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
        />
      </div>
      
      <Separator className="bg-editor-border" />
      
      <ServerStatus language={selectedLanguage} isOnline={isOnline} />
    </div>
  );
};

export default FileExplorerPanel;
