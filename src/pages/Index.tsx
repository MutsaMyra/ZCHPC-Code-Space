import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FileNode } from '../components/FileExplorer';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { executionService, ExecutionConfig } from '../services/executionService';
import { projectManager } from '../services/projectManager';
import { useCodeExecution } from '../hooks/useCodeExecution';
import { useAutoSave } from '../hooks/useAutoSave';
import { toast } from 'sonner';
import SyncStatusIndicator from '../components/SyncStatusIndicator';

// Import the refactored components
import FileExplorerPanel from '../components/FileExplorerPanel';
import EditorPanel from '../components/EditorPanel';
import TerminalPanel from '../components/TerminalPanel';

const Index = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [executionConfig, setExecutionConfig] = useState<ExecutionConfig>({
    mode: navigator.onLine ? 'online' : 'offline',
    hardware: 'cpu',
    cpuCores: 4,
    gpuMemory: 4,
    autoDetect: true,
    timeout: 30
  });
  
  // Use the code execution hook
  const { 
    isRunning, 
    terminalOutput, 
    runCode,
    clearTerminal
  } = useCodeExecution();

  // Auto-save functionality
  const { forceSave } = useAutoSave(files, currentProjectId, {
    enabled: true,
    delay: 2000,
  });
  
  // Check if user has a current project, otherwise redirect to landing
  useEffect(() => {
    const currentProject = projectManager.getCurrentProject();
    if (!currentProject) {
      navigate('/');
      return;
    }
    
    setCurrentProjectId(currentProject.metadata.id);
    setFiles(currentProject.files);
    setSelectedLanguage(currentProject.metadata.language);
    
    // Select first file if available
    const firstFile = findFirstFile(currentProject.files);
    if (firstFile) {
      setSelectedFile(firstFile);
      setEditorContent(firstFile.content || '');
    }
  }, [navigate]);

  // Helper function to find first file in the project
  const findFirstFile = (fileNodes: FileNode[]): FileNode | null => {
    for (const node of fileNodes) {
      if (node.type === 'file') {
        return node;
      } else if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  
  // Update online status when connection changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    // Update execution mode based on connectivity when auto-detect is enabled
    if (executionConfig.autoDetect) {
      const recommendedMode = executionService.getRecommendedMode();
      if (recommendedMode !== executionConfig.mode) {
        setExecutionConfig(prev => ({ ...prev, mode: recommendedMode }));
      }
    }
  }, [executionConfig.autoDetect, isOnline]);
  
  const handleFileSelect = (file: FileNode) => {
    setSelectedFile(file);
    setEditorContent(file.content || '');
  };
  
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && selectedFile) {
      setEditorContent(value);
      
      // Update file content
      const updatedFile = { ...selectedFile, content: value };
      
      // Update files array
      setFiles(prevFiles => {
        const updateFileContent = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
            if (node.id === selectedFile.id) {
              return { ...node, content: value };
            } else if (node.children) {
              return {
                ...node,
                children: updateFileContent(node.children),
              };
            }
            return node;
          });
        };
        
        return updateFileContent(prevFiles);
      });
    }
  };

  const handleRunCode = () => {
    runCode(selectedFile, selectedLanguage, executionConfig, isOnline);
  };

  const handleRunCodeCell = async (code: string) => {
    if (!code.trim()) return;
    
    // TODO: Implement cell-specific execution
    // This will need to be enhanced to support:
    // 1. Maintaining kernel state between cell executions
    // 2. Variable persistence across cells
    // 3. Proper output capturing and display
    
    // For now, use the existing execution service
    return new Promise<void>((resolve, reject) => {
      // Create a temporary file node for the cell code
      const tempFile: FileNode = {
        id: 'temp-cell',
        name: 'temp.py',
        type: 'file',
        content: code
      };
      
      runCode(tempFile, selectedLanguage, executionConfig, isOnline)
        .then(() => resolve())
        .catch(() => reject(new Error('Cell execution failed')));
    });
  };

  const handleSave = () => {
    forceSave();
    toast.success('Project saved successfully');
  };

  // If no project is loaded, show loading or redirect
  if (!currentProjectId) {
    return (
      <div className="flex items-center justify-center h-screen bg-editor text-editor-text">
        <div className="text-center">
          <div className="text-lg">Loading project...</div>
          <div className="text-sm text-editor-text-muted mt-2">
            If this persists, you may need to create or select a project.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-editor text-editor-text">
      <Navbar 
        selectedLanguage={selectedLanguage} 
        onLanguageChange={setSelectedLanguage} 
        onRunCode={handleRunCode}
        onSave={handleSave}
        isRunning={isRunning}
        executionConfig={executionConfig}
        onExecutionConfigChange={setExecutionConfig}
        isOnline={isOnline}
      />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={15} minSize={10} maxSize={30}>
          <div className="h-full flex flex-col">
            <div className="flex-1">
              <FileExplorerPanel
                files={files}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                selectedLanguage={selectedLanguage}
                isOnline={isOnline}
              />
            </div>
            <SyncStatusIndicator isOnline={isOnline} />
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-editor-border" />
        
        <ResizablePanel defaultSize={85} className="bg-editor flex flex-col overflow-hidden">
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={70} minSize={30} className="overflow-hidden">
              <EditorPanel 
                selectedFile={selectedFile}
                selectedLanguage={selectedLanguage}
                onEditorChange={handleEditorChange}
                onRunCode={handleRunCodeCell}
                isOnline={isOnline}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle className="bg-editor-border" />
            
            <ResizablePanel defaultSize={30} minSize={20}>
              <TerminalPanel 
                terminalOutput={terminalOutput}
                isRunning={isRunning}
                executionConfig={executionConfig}
                isOnline={isOnline}
                onClearTerminal={clearTerminal}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
