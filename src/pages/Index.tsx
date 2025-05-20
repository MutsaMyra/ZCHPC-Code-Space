
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FileExplorer, { FileNode } from '../components/FileExplorer';
import MonacoEditor from '../components/MonacoEditor';
import ServerStatus from '../components/ServerStatus';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from '@/components/ui/separator';
import { languages } from '../components/LanguageSelector';

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
  
  useEffect(() => {
    // Reset selected file when changing language
    setSelectedFile(null);
  }, [selectedLanguage]);
  
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

  return (
    <div className="flex flex-col h-screen bg-editor text-editor-text">
      <Navbar selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />
      
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
        
        <ResizablePanel defaultSize={85} className="bg-editor">
          <div className="h-full w-full">
            <MonacoEditor 
              file={selectedFile} 
              language={selectedLanguage}
              onChange={handleEditorChange}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
