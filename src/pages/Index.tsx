import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

const Index = () => {
  const { projectId } = useParams();
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [savePromptTimer, setSavePromptTimer] = useState<NodeJS.Timeout | null>(null);
  const [showCollaborativePanel, setShowCollaborativePanel] = useState(false);
  const [showWebPreview, setShowWebPreview] = useState(false);
  
  const { runCode, isRunning, terminalOutput, clearTerminal } = useCodeExecution();
  const { saveFile, saveProject, configureSaveLocation, setCurrentProject, isConfigured, markPendingChanges, activityLog } = useAutoSave();
  
  const [executionConfig, setExecutionConfig] = useState<ExecutionConfig>({
    mode: 'online',
    hardware: 'cpu',
    cpuCores: 4,
    gpuMemory: 8,
    autoDetect: true,
    timeout: 30
  });

  useEffect(() => {
    // Handle project loading based on URL parameter
    if (projectId) {
      const project = projectManager.getProject(projectId);
      if (project) {
        projectManager.setCurrentProject(projectId);
        setFiles(project.files);
        setSelectedLanguage(project.metadata.language);
        setCurrentProject(project.metadata.id);
        
        // Check if project has storage location, if not, prompt for it
        const checkStorageLocation = async () => {
          const { projectStorageService } = await import('../services/projectStorageService');
          if (!projectStorageService.hasProjectLocation(project.metadata.id)) {
            setShowSavePrompt(true);
          }
        };
        checkStorageLocation();
        
        const isWebProject = isWebProjectType(
          project.metadata.language, 
          project.metadata.framework
        );
        setShowWebPreview(isWebProject);
        
        webPreviewService.setProjectContext(
          project.metadata.language, 
          project.metadata.framework || 'Vanilla'
        );
        
        if (project.files.length > 0) {
          setSelectedFile(project.files[0]);
        }
      }
    } else {
      // Fallback to current project or default files
      const currentProject = projectManager.getCurrentProject();
      if (currentProject) {
        setFiles(currentProject.files);
        setSelectedLanguage(currentProject.metadata.language);
        setCurrentProject(currentProject.metadata.id);
        
        // Check if project has storage location, if not, prompt for it
        const checkStorageLocation = async () => {
          const { projectStorageService } = await import('../services/projectStorageService');
          if (!projectStorageService.hasProjectLocation(currentProject.metadata.id)) {
            setShowSavePrompt(true);
          }
        };
        checkStorageLocation();
        
        const isWebProject = isWebProjectType(
          currentProject.metadata.language, 
          currentProject.metadata.framework
        );
        setShowWebPreview(isWebProject);
        
        webPreviewService.setProjectContext(
          currentProject.metadata.language, 
          currentProject.metadata.framework || 'Vanilla'
        );
        
        if (currentProject.files.length > 0) {
          setSelectedFile(currentProject.files[0]);
        }
      } else {
        setFiles(fileSystemService.getFiles());
      }
    }
  }, [projectId, setCurrentProject]);

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

  // Remove the old save prompt timer effect since we handle it differently now

  useEffect(() => {
    if (selectedFile && selectedFile.content) {
      markPendingChanges(selectedFile);
    }
  }, [selectedFile, markPendingChanges]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    
    const currentProject = projectManager.getCurrentProject();
    if (currentProject) {
      const isWebProject = isWebProjectType(language, currentProject.metadata.framework);
      setShowWebPreview(isWebProject);
      
      // Update web preview context
      webPreviewService.setProjectContext(language, currentProject.metadata.framework || 'Vanilla');
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
    const currentProject = projectManager.getCurrentProject();
    if (currentProject) {
      if (selectedFile) {
        await saveFile(selectedFile);
      } else {
        await saveProject(currentProject);
      }
    }
  };

  const handleSaveLocationSetup = async () => {
    const currentProject = projectManager.getCurrentProject();
    if (currentProject) {
      const success = await configureSaveLocation(currentProject.metadata.id, currentProject.metadata.name);
      if (success) {
        setShowSavePrompt(false);
      }
    }
  };

  const isWebProjectType = (language: string, framework?: string) => {
    const webLanguages = ['javascript', 'typescript', 'html', 'css', 'php'];
    const webFrameworks = ['React', 'Vue', 'Svelte', 'Vanilla', 'Express'];
    
    return webLanguages.includes(language.toLowerCase()) || 
           (framework && webFrameworks.includes(framework));
  };

  const isWebProject = () => {
    const currentProject = projectManager.getCurrentProject();
    if (currentProject) {
      return isWebProjectType(selectedLanguage, currentProject.metadata.framework);
    }
    return isWebProjectType(selectedLanguage);
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
        isWebProject={isWebProject()}
        isPreviewVisible={showWebPreview}
        onTogglePreview={() => setShowWebPreview(!showWebPreview)}
      />
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full flex flex-col">
              <FileExplorerPanel
                files={files}
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onFilesChange={(newFiles) => setFiles(newFiles)}
                selectedLanguage={selectedLanguage}
                isOnline={isOnline}
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
                      selectedFile={selectedFile}
                      language={selectedLanguage}
                      framework={projectManager.getCurrentProject()?.metadata.framework || 'Vanilla'}
                      isVisible={showWebPreview}
                      onToggleVisibility={() => setShowWebPreview(!showWebPreview)}
                    />
                  </ResizablePanel>
                  <ResizableHandle />
                </>
              )}
              
              <ResizablePanel defaultSize={showWebPreview ? 40 : 100}>
                <TerminalPanel
                  terminalOutput={terminalOutput}
                  onClear={clearTerminal}
                  isRunning={isRunning}
                  executionConfig={executionConfig}
                  isOnline={isOnline}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      <SaveLocationPrompt
        isOpen={showSavePrompt}
        onClose={() => setShowSavePrompt(false)}
        onSaveLocationSet={handleSaveLocationSetup}
        projectName={projectManager.getCurrentProject()?.metadata.name || 'Untitled Project'}
      />
    </div>
  );
};

export default Index;
