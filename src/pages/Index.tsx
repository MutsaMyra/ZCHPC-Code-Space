
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

const generateSampleFiles = () => {
  const sampleFiles: FileNode[] = [
    {
      id: 'examples',
      name: 'Examples',
      type: 'folder',
      children: languages.map((lang) => ({
        id: `example-${lang.id}`,
        name: `Sample${lang.extension}`,
        type: 'file',
        extension: lang.extension,
      })),
    },
    {
      id: 'project',
      name: 'My Project',
      type: 'folder',
      children: [
        {
          id: 'src',
          name: 'src',
          type: 'folder',
          children: [
            {
              id: 'main',
              name: 'main.js',
              type: 'file',
              extension: '.js',
              content: 'console.log("Hello World!");'
            },
          ],
        },
        {
          id: 'docs',
          name: 'docs',
          type: 'folder',
          children: [
            {
              id: 'readme',
              name: 'README.md',
              type: 'file',
              extension: '.md',
              content: '# My Project\n\nWelcome to my project!'
            },
          ],
        },
      ],
    },
  ];

  return sampleFiles;
};

const Index = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [files, setFiles] = useState<FileNode[]>(generateSampleFiles());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [executionConfig, setExecutionConfig] = useState<ExecutionConfig>({
    mode: 'online',
    hardware: 'cpu',
    cpuCores: 4,
    gpuMemory: 4,
    autoDetect: true,
    timeout: 30
  });
  const [lastExecutionResult, setLastExecutionResult] = useState<ExecutionResult | null>(null);
  
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
  }, [executionConfig.autoDetect]);
  
  const handleFileSelect = (file: FileNode) => {
    setSelectedFile(file);
  };
  
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && selectedFile) {
      setEditorContent(value);
      
      // Update file content
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
      `[${new Date().toLocaleTimeString()}] Running ${selectedFile.name} in ${executionConfig.mode} mode using ${executionConfig.hardware.toUpperCase()}...`
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
      />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={15} minSize={10} maxSize={30} className="bg-editor-sidebar border-r border-editor-border">
          <div className="p-4">
            <h2 className="text-sm font-semibold mb-2">Files</h2>
            <FileExplorer 
              files={files} 
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
          </div>
          
          <Separator className="bg-editor-border" />
          
          <ServerStatus language={selectedLanguage} />
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-editor-border" />
        
        <ResizablePanel defaultSize={85} className="bg-editor flex flex-col">
          <div className="flex-1">
            <MonacoEditor 
              file={selectedFile} 
              language={selectedLanguage}
              onChange={handleEditorChange}
            />
          </div>
          
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} minSize={40}>
              <div className="h-full w-full"></div>
            </ResizablePanel>
            
            <ResizableHandle withHandle className="bg-editor-border" />
            
            <ResizablePanel defaultSize={30} minSize={10} className="p-4 border-t border-editor-border">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Output</h3>
                <div className="flex space-x-2">
                  {executionConfig.mode === 'online' ? (
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
              <Terminal output={terminalOutput} isRunning={isRunning} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
