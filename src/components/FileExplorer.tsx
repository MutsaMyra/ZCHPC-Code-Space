
import React, { useState } from 'react';
import { Folder, File, ChevronDown, ChevronRight, Plus, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
  onCreateFile?: (parentId: string, fileName: string) => void;
  onCreateFolder?: (parentId: string, folderName: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  onFileSelect, 
  selectedFile, 
  onCreateFile,
  onCreateFolder 
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'root': true,
  });
  const [creatingFile, setCreatingFile] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleCreateFile = (parentId: string = 'root') => {
    setCreatingFile(parentId);
    setNewItemName('');
  };

  const handleCreateFolder = (parentId: string = 'root') => {
    setCreatingFolder(parentId);
    setNewItemName('');
  };

  const confirmCreate = () => {
    if (!newItemName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    if (creatingFile) {
      onCreateFile?.(creatingFile, newItemName);
      setCreatingFile(null);
    } else if (creatingFolder) {
      onCreateFolder?.(creatingFolder, newItemName);
      setCreatingFolder(null);
    }
    setNewItemName('');
  };

  const cancelCreate = () => {
    setCreatingFile(null);
    setCreatingFolder(null);
    setNewItemName('');
  };

  const renderFileTree = (nodes: FileNode[], level = 0, parentId = 'root') => {
    return (
      <>
        {nodes.map(node => {
          const isFolder = node.type === 'folder';
          const isExpanded = expandedFolders[node.id];
          const isSelected = selectedFile?.id === node.id;

          return (
            <div key={node.id}>
              <div 
                className={cn(
                  "flex items-center py-1 px-2 cursor-pointer hover:bg-editor-highlight rounded group",
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
                <span className="text-sm truncate flex-1">{node.name}</span>
                
                {isFolder && (
                  <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateFile(node.id);
                      }}
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateFolder(node.id);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              
              {isFolder && isExpanded && node.children && (
                <div>
                  {renderFileTree(node.children, level + 1, node.id)}
                  
                  {/* Show create inputs for this folder */}
                  {(creatingFile === node.id || creatingFolder === node.id) && (
                    <div className="flex items-center py-1 px-2" style={{ paddingLeft: `${(level + 1) * 12 + 4}px` }}>
                      <span className="mr-1">
                        {creatingFile === node.id ? <File className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                      </span>
                      <Input
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder={creatingFile === node.id ? "filename.ext" : "folder name"}
                        className="h-6 text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmCreate();
                          if (e.key === 'Escape') cancelCreate();
                        }}
                        onBlur={confirmCreate}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Show create inputs for root level */}
        {level === 0 && (creatingFile === parentId || creatingFolder === parentId) && (
          <div className="flex items-center py-1 px-2" style={{ paddingLeft: `${level * 12 + 4}px` }}>
            <span className="mr-1">
              {creatingFile === parentId ? <File className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
            </span>
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={creatingFile === parentId ? "filename.ext" : "folder name"}
              className="h-6 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmCreate();
                if (e.key === 'Escape') cancelCreate();
              }}
              onBlur={confirmCreate}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="w-full h-full overflow-auto text-editor-text">
      <div className="flex items-center justify-between p-2 border-b border-editor-border">
        <span className="text-sm font-medium">Files</span>
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => handleCreateFile('root')}
            title="New File"
          >
            <FileText className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => handleCreateFolder('root')}
            title="New Folder"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {renderFileTree(files)}
    </div>
  );
};

export default FileExplorer;
