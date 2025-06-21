
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, RefreshCw, ExternalLink, Eye, EyeOff, Play, AlertCircle } from 'lucide-react';
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
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-editor-sidebar/50">
        <div className="text-center space-y-4">
          <Monitor className="h-12 w-12 text-editor-text-muted mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-editor-text mb-2">Web Preview Available</h3>
            <p className="text-sm text-editor-text-muted mb-4">
              Create a web project (JavaScript, HTML, React, etc.) to see live preview
            </p>
            <div className="text-xs text-editor-text-muted bg-editor-highlight p-3 rounded">
              <strong>Supported:</strong> JavaScript, HTML, CSS, React, Vue, PHP
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-editor-border bg-editor-sidebar">
        <div className="flex items-center space-x-2">
          <Monitor className="h-4 w-4 text-editor-text-muted" />
          <span className="text-sm font-medium text-editor-text">Live Preview</span>
          <span className="text-xs text-editor-text-muted">
            {language} • {framework}
          </span>
          {previewContent && (
            <div className="flex items-center space-x-1 text-xs text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          )}
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
            disabled={!previewContent}
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
        <div className="flex-1 bg-white relative">
          {!previewContent && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center space-y-4">
                <Play className="h-12 w-12 text-blue-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Ready for Live Preview</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Your {language} code will appear here automatically
                  </p>
                  <Button onClick={handleRefresh} className="bg-blue-500 hover:bg-blue-600">
                    <Play className="h-4 w-4 mr-2" />
                    Start Preview
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-gray-600">Generating live preview...</p>
              </div>
            </div>
          )}
          
          {previewContent && (
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              title="Live Web Preview"
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
