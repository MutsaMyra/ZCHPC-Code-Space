import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import Navbar from '../components/Navbar';
import FileExplorerPanel from '../components/FileExplorerPanel';
import EditorPanel from '../components/EditorPanel';
import TerminalPanel from '../components/TerminalPanel';
import WebPreview from '../components/WebPreview';
import CollaborativeEditor from '../components/CollaborativeEditor';
import SaveLocationPrompt from '../components/SaveLocationPrompt';
import { FileNode } from '../components/FileExplorer';
import { useCodeExecution } from '../hooks/useCodeExecution';
import { useAutoSave } from '../hooks/useAutoSave';
import { ExecutionConfig } from '../services/executionService';
import { fileSystemService } from '../services/fileSystemService';
import { projectManager } from '../services/projectManager';
import { webPreviewService } from '../services/webPreviewService';
import { languages } from '../components/LanguageSelector';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [savePromptTimer, setSavePromptTimer] = useState<NodeJS.Timeout | null>(null);
  const [showCollaborativePanel, setShowCollaborativePanel] = useState(false);
  const [showWebPreview, setShowWebPreview] = useState(false);
  
  const { runCode, isRunning, terminalOutput, clearTerminal } = useCodeExecution();
  const { saveFile, saveProject, configureSaveLocation, isConfigured, markPendingChanges, activityLog } = useAutoSave();
  
  const [executionConfig, setExecutionConfig] = useState<ExecutionConfig>({
    mode: 'online',
    hardware: 'cpu',
    cpuCores: 4,
    gpuMemory: 8,
    autoDetect: true,
    timeout: 30
  });

  useEffect(() => {
    const currentProject = projectManager.getCurrentProject();
    if (currentProject) {
      setFiles(currentProject.files);
      setSelectedLanguage(currentProject.metadata.language);
      
      const isWebProject = webPreviewService.isWebProject(currentProject.metadata.language, currentProject.metadata.framework);
      setShowWebPreview(isWebProject);
      
      if (currentProject.files.length > 0) {
        setSelectedFile(currentProject.files[0]);
      }
    } else {
      setFiles(fileSystemService.getFiles());
    }
  }, []);

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
    if (!isConfigured) {
      const timer = setTimeout(() => {
        setShowSavePrompt(true);
      }, 5 * 60 * 1000);
      
      setSavePromptTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [isConfigured]);

  useEffect(() => {
    if (selectedFile && selectedFile.content) {
      markPendingChanges();
      
      const autoSaveTimer = setTimeout(() => {
        saveFile(selectedFile);
      }, 30000);
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [selectedFile, markPendingChanges, saveFile]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    
    const currentProject = projectManager.getCurrentProject();
    if (currentProject) {
      const isWebProject = webPreviewService.isWebProject(language, currentProject.metadata.framework);
      setShowWebPreview(isWebProject);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (selectedFile && value !== undefined) {
      const updatedFile = { ...selectedFile, content: value };
      setSelectedFile(updatedFile);
      
      const updateFilesRecursively = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.id === selectedFile.id) {
            return updatedFile;
          } else if (node.children) {
            return { ...node, children: updateFilesRecursively(node.children) };
          }
          return node;
        });
      };
      
      setFiles(updateFilesRecursively(files));
      
      const currentProject = projectManager.getCurrentProject();
      if (currentProject) {
        projectManager.updateProjectFiles(currentProject.metadata.id, updateFilesRecursively(files));
      }
    }
  };

  const handleRunCode = async () => {
    await runCode(selectedFile, selectedLanguage, executionConfig, isOnline);
  };

  const handleSave = async () => {
    if (selectedFile) {
      await saveFile(selectedFile);
    } else {
      const currentProject = projectManager.getCurrentProject();
      if (currentProject) {
        await saveProject(files, currentProject.metadata.name);
      }
    }
  };

  const handleSaveLocationSetup = async () => {
    const success = await configureSaveLocation();
    if (success) {
      setShowSavePrompt(false);
      if (savePromptTimer) {
        clearTimeout(savePromptTimer);
        setSavePromptTimer(null);
      }
    }
  };

  return (
    <div className="h-screen bg-editor flex flex-col">
      <Navbar
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        onRunCode={handleRunCode}
        onSave={handleSave}
        isRunning={isRunning}
        executionConfig={executionConfig}
        onExecutionConfigChange={setExecutionConfig}
        isOnline={isOnline}
      />
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full flex flex-col">
              <FileExplorerPanel
                files={files}
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onFileChange={(newFiles) => setFiles(newFiles)}
              />
              
              <div className="p-2 border-t border-editor-border">
                <button
                  onClick={() => setShowCollaborativePanel(!showCollaborativePanel)}
                  className="w-full text-sm text-editor-text hover:bg-editor-highlight p-2 rounded"
                >
                  {showCollaborativePanel ? 'Hide' : 'Show'} Collaboration
                </button>
              </div>
              
              {showCollaborativePanel && (
                <div className="border-t border-editor-border p-2">
                  <CollaborativeEditor
                    projectId={projectManager.getCurrentProject()?.metadata.id || 'default'}
                    onShare={(projectId) => console.log('Sharing project:', projectId)}
                  />
                </div>
              )}
            </div>
          </ResizablePanel>
          
          <ResizableHandle />
          
          <ResizablePanel defaultSize={showWebPreview ? 40 : 50}>
            <EditorPanel
              selectedFile={selectedFile}
              selectedLanguage={selectedLanguage}
              onEditorChange={handleEditorChange}
              onRunCode={async (code) => {
                if (selectedFile) {
                  const tempFile = { ...selectedFile, content: code };
                  await runCode(tempFile, selectedLanguage, executionConfig, isOnline);
                }
              }}
              isOnline={isOnline}
            />
          </ResizablePanel>
          
          <ResizableHandle />
          
          <ResizablePanel defaultSize={showWebPreview ? 40 : 30}>
            <ResizablePanelGroup direction="vertical">
              {showWebPreview && (
                <>
                  <ResizablePanel defaultSize={60}>
                    <WebPreview
                      files={files}
                      selectedLanguage={selectedLanguage}
                      framework={projectManager.getCurrentProject()?.metadata.framework || 'Vanilla'}
                    />
                  </ResizablePanel>
                  <ResizableHandle />
                </>
              )}
              
              <ResizablePanel defaultSize={showWebPreview ? 40 : 100}>
                <TerminalPanel
                  output={terminalOutput}
                  onClear={clearTerminal}
                  isRunning={isRunning}
                  activityLog={activityLog}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      <SaveLocationPrompt
        isOpen={showSavePrompt}
        onSetLocation={handleSaveLocationSetup}
        onDismiss={() => setShowSavePrompt(false)}
      />
    </div>
  );
};

export default Index;
