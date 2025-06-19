
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, RefreshCw, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { webPreviewService } from '../services/webPreviewService';
import { FileNode } from './FileExplorer';

interface WebPreviewProps {
  files: FileNode[];
  selectedFile: FileNode | null;
  language: string;
  framework: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const WebPreview: React.FC<WebPreviewProps> = ({
  files,
  selectedFile,
  language,
  framework,
  isVisible,
  onToggleVisibility
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');

  useEffect(() => {
    webPreviewService.setProjectContext(language, framework);
  }, [language, framework]);

  useEffect(() => {
    if (isVisible && webPreviewService.isWebProjectActive()) {
      updatePreview();
    }
  }, [files, selectedFile, isVisible]);

  useEffect(() => {
    if (iframeRef.current && previewContent) {
      webPreviewService.setPreviewFrame(iframeRef.current);
    }
  }, [previewContent]);

  const updatePreview = async () => {
    if (!webPreviewService.isWebProjectActive()) return;

    setIsLoading(true);
    try {
      const content = await webPreviewService.generatePreview(files, selectedFile);
      if (content) {
        setPreviewContent(content);
        if (iframeRef.current) {
          iframeRef.current.srcdoc = content;
        }
      }
    } catch (error) {
      console.error('Failed to update preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    updatePreview();
  };

  const handleOpenInNewTab = () => {
    if (previewContent) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(previewContent);
        newWindow.document.close();
      }
    }
  };

  if (!webPreviewService.isWebProjectActive()) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-editor-border bg-editor-sidebar">
        <div className="flex items-center space-x-2">
          <Monitor className="h-4 w-4 text-editor-text-muted" />
          <span className="text-sm font-medium text-editor-text">Web Preview</span>
          <span className="text-xs text-editor-text-muted">
            {language} • {framework}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-7 w-7 p-0"
            title="Refresh Preview"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenInNewTab}
            className="h-7 w-7 p-0"
            title="Open in New Tab"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVisibility}
            className="h-7 w-7 p-0"
            title={isVisible ? "Hide Preview" : "Show Preview"}
          >
            {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        </div>
      </div>
      
      {isVisible && (
        <div className="flex-1 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Generating preview...</p>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              title="Web Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
              srcDoc={previewContent}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default WebPreview;
