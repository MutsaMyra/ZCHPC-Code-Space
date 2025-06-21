
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
import SaveLocationPrompt from '../components/SaveLocationPrompt';
import WebPreview from '../components/WebPreview';

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
  const [currentProjectName, setCurrentProjectName] = useState<string>('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [saveLocationSet, setSaveLocationSet] = useState(false);
  const [webPreviewVisible, setWebPreviewVisible] = useState(false);
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
    setCurrentProjectName(currentProject.metadata.name);
    setFiles(currentProject.files);
    setSelectedLanguage(currentProject.metadata.language);
    
    // Select first file if available
    const firstFile = findFirstFile(currentProject.files);
    if (firstFile) {
      setSelectedFile(firstFile);
      setEditorContent(firstFile.content || '');
    }

    // Show save location prompt after 2 minutes if not set
    const timer = setTimeout(() => {
      if (!saveLocationSet) {
        setShowSavePrompt(true);
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearTimeout(timer);
  }, [navigate, saveLocationSet]);

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

  // Determine if web preview should be available
  const isWebProject = selectedLanguage === 'javascript' || 
    (selectedFile && (selectedFile.extension === '.html' || selectedFile.extension === '.css'));
  
  const handleFileSelect = (file: FileNode) => {
    setSelectedFile(file);
    setEditorContent(file.content || '');
  };

  const handleFilesChange = (newFiles: FileNode[]) => {
    setFiles(newFiles);
    // Update project with new files
    if (currentProjectId) {
      projectManager.updateProjectFiles(currentProjectId, newFiles);
    }
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
    
    // Create a temporary file node for the cell code
    const tempFile: FileNode = {
      id: 'temp-cell',
      name: 'temp.py',
      type: 'file',
      content: code
    };
    
    return runCode(tempFile, selectedLanguage, executionConfig, isOnline);
  };

  const handleSave = () => {
    forceSave();
    toast.success('Project saved successfully');
  };

  const handleSaveLocationSet = () => {
    setSaveLocationSet(true);
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
                onFilesChange={handleFilesChange}
                selectedLanguage={selectedLanguage}
                isOnline={isOnline}
              />
            </div>
            <SyncStatusIndicator isOnline={isOnline} />
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-editor-border" />
        
        <ResizablePanel defaultSize={isWebProject && webPreviewVisible ? 60 : 85} className="bg-editor flex flex-col overflow-hidden">
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

        {/* Web Preview Panel */}
        {isWebProject && (
          <>
            <ResizableHandle withHandle className="bg-editor-border" />
            <ResizablePanel 
              defaultSize={webPreviewVisible ? 25 : 0} 
              minSize={webPreviewVisible ? 20 : 0}
              maxSize={webPreviewVisible ? 50 : 0}
            >
              <WebPreview
                files={files}
                selectedFile={selectedFile}
                language={selectedLanguage}
                framework="React"
                isVisible={webPreviewVisible}
                onToggleVisibility={() => setWebPreviewVisible(!webPreviewVisible)}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Save Location Prompt */}
      <SaveLocationPrompt
        isOpen={showSavePrompt}
        onClose={() => setShowSavePrompt(false)}
        onSaveLocationSet={handleSaveLocationSet}
        projectName={currentProjectName}
      />
    </div>
  );
};

export default Index;
