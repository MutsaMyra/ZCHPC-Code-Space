
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FileExplorer, { FileNode } from '../components/FileExplorer';
import MonacoEditor from '../components/MonacoEditor';
import ServerStatus from '../components/ServerStatus';
import Terminal from '../components/Terminal';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from '@/components/ui/separator';
import { languages } from '../components/LanguageSelector';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ExecutionService, 
  executionService, 
  ExecutionConfig, 
  ExecutionResult 
} from '../services/executionService';
import { fileSystemService } from '../services/fileSystemService';

const Index = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [executionConfig, setExecutionConfig] = useState<ExecutionConfig>({
    mode: 'online',
    hardware: 'cpu',
    cpuCores: 4,
    gpuMemory: 4,
    autoDetect: true,
    timeout: 30
  });
  const [lastExecutionResult, setLastExecutionResult] = useState<ExecutionResult | null>(null);
  
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

  const handleRunCode = async () => {
    if (!selectedFile) {
      toast.error('No file selected to run');
      return;
    }

    setIsRunning(true);
    setTerminalOutput([
      `[${new Date().toLocaleTimeString()}] Running ${selectedFile.name} in ${executionConfig.mode} mode using ${executionConfig.hardware.toUpperCase()}...`,
      isOnline ? 'Network connected: Remote execution available' : 'Network disconnected: Using local execution only'
    ]);

    try {
      const result = await executionService.executeCode(
        selectedFile.content || '',
        selectedLanguage,
        executionConfig
      );

      setLastExecutionResult(result);
      
      // Update terminal with execution results
      setTerminalOutput(prev => [
        ...prev,
        ...result.output,
        `[${new Date().toLocaleTimeString()}] Execution completed in ${result.executionTime.toFixed(2)}s with exit code ${result.exitCode}`
      ]);
      
      if (result.exitCode === 0) {
        toast.success('Code executed successfully', {
          description: `Completed in ${result.executionTime.toFixed(2)}s`
        });
      } else {
        toast.error('Execution failed', {
          description: result.errors?.[0] || 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Execution error:', error);
      setTerminalOutput(prev => [
        ...prev,
        `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      ]);
      toast.error('Execution error', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsRunning(false);
    }
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
        <ResizablePanel defaultSize={15} minSize={10} maxSize={30} className="bg-editor-sidebar border-r border-editor-border">
          <div className="p-4 h-[calc(100%-180px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Files</h2>
              <Badge className={isOnline ? "bg-blue-600" : "bg-yellow-600"}>
                {isOnline ? "Cloud Storage" : "Local Storage"}
              </Badge>
            </div>
            
            <FileExplorer 
              files={files} 
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
          </div>
          
          <Separator className="bg-editor-border" />
          
          <ServerStatus language={selectedLanguage} isOnline={isOnline} />
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-editor-border" />
        
        <ResizablePanel defaultSize={85} className="bg-editor flex flex-col overflow-hidden">
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={70} minSize={30} className="overflow-hidden">
              {selectedFile ? (
                <div className="h-full">
                  <MonacoEditor 
                    file={selectedFile} 
                    language={selectedLanguage}
                    onChange={handleEditorChange}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-editor-text-muted h-full">
                  <div className="text-center p-6">
                    <h3 className="text-xl font-semibold mb-2">No File Selected</h3>
                    <p>Select a file from the explorer to start coding</p>
                  </div>
                </div>
              )}
            </ResizablePanel>
            
            <ResizableHandle withHandle className="bg-editor-border" />
            
            <ResizablePanel defaultSize={30} minSize={20} className="p-4 border-t border-editor-border overflow-hidden">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Output</h3>
                <div className="flex space-x-2">
                  {executionConfig.mode === 'online' && isOnline ? (
                    <Badge className="bg-blue-600">ONLINE</Badge>
                  ) : (
                    <Badge className="bg-green-600">LOCAL</Badge>
                  )}
                  <Badge className="bg-editor-sidebar">
                    {executionConfig.hardware.toUpperCase()} 
                    {executionConfig.hardware === 'cpu' 
                      ? ` (${executionConfig.cpuCores} cores)` 
                      : ` (${executionConfig.gpuMemory} GB)`}
                  </Badge>
                </div>
              </div>
              <div className="h-[calc(100%-30px)]">
                <Terminal output={terminalOutput} isRunning={isRunning} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
