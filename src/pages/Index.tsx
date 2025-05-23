
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { FileNode } from '../components/FileExplorer';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { languages } from '../components/LanguageSelector';
import { executionService, ExecutionConfig } from '../services/executionService';
import { fileSystemService } from '../services/fileSystemService';
import { useCodeExecution } from '../hooks/useCodeExecution';

// Import the refactored components
import FileExplorerPanel from '../components/FileExplorerPanel';
import EditorPanel from '../components/EditorPanel';
import TerminalPanel from '../components/TerminalPanel';

const Index = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [executionConfig, setExecutionConfig] = useState<ExecutionConfig>({
    mode: 'online',
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
    runCode 
  } = useCodeExecution();
  
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
  
  // Load files based on connection status
  useEffect(() => {
    setFiles(fileSystemService.getFiles());
  }, [isOnline]);
  
  useEffect(() => {
    // Reset selected file when changing language
    setSelectedFile(null);
  }, [selectedLanguage]);
  
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

  return (
    <div className="flex flex-col h-screen bg-editor text-editor-text">
      <Navbar 
        selectedLanguage={selectedLanguage} 
        onLanguageChange={setSelectedLanguage} 
        onRunCode={handleRunCode}
        isRunning={isRunning}
        executionConfig={executionConfig}
        onExecutionConfigChange={setExecutionConfig}
        isOnline={isOnline}
      />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={15} minSize={10} maxSize={30}>
          <FileExplorerPanel
            files={files}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            selectedLanguage={selectedLanguage}
            isOnline={isOnline}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-editor-border" />
        
        <ResizablePanel defaultSize={85} className="bg-editor flex flex-col overflow-hidden">
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={70} minSize={30} className="overflow-hidden">
              <EditorPanel 
                selectedFile={selectedFile}
                selectedLanguage={selectedLanguage}
                onEditorChange={handleEditorChange}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle className="bg-editor-border" />
            
            <ResizablePanel defaultSize={30} minSize={20}>
              <TerminalPanel 
                terminalOutput={terminalOutput}
                isRunning={isRunning}
                executionConfig={executionConfig}
                isOnline={isOnline}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
