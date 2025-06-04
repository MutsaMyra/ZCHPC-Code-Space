
import React, { useState } from 'react';
import { Folder, File, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  children?: FileNode[];
  content?: string;
  lastModified?: Date;
}

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedFile?: FileNode | null;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, onFileSelect, selectedFile }) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'root': true,
  });

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => {
      const isFolder = node.type === 'folder';
      const isExpanded = expandedFolders[node.id];
      const isSelected = selectedFile?.id === node.id;

      return (
        <div key={node.id}>
          <div 
            className={cn(
              "flex items-center py-1 px-2 cursor-pointer hover:bg-editor-highlight rounded",
              isSelected && "bg-editor-active"
            )}
            style={{ paddingLeft: `${level * 12 + 4}px` }}
            onClick={() => isFolder ? toggleFolder(node.id) : onFileSelect(node)}
          >
            <span className="mr-1">
              {isFolder ? 
                (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : 
                <File className="h-4 w-4" />
              }
            </span>
            {isFolder ? <Folder className="h-4 w-4 mr-1" /> : null}
            <span className="text-sm truncate">{node.name}</span>
          </div>
          {isFolder && isExpanded && node.children && (
            <div>
              {renderFileTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-full h-full overflow-auto text-editor-text">
      {renderFileTree(files)}
    </div>
  );
};

export default FileExplorer;
