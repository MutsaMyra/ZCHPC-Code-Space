
import React, { useEffect, useRef, useState } from 'react';
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
  const [error, setError] = useState<string>('');

  // Initialize web preview service
  useEffect(() => {
    console.log('Setting web preview context:', { language, framework });
    webPreviewService.setProjectContext(language, framework);
  }, [language, framework]);

  // Generate preview when files or selection changes
  useEffect(() => {
    if (isVisible && webPreviewService.isWebProjectActive()) {
      updatePreview();
    }
  }, [files, selectedFile, isVisible, language, framework]);

  // Set iframe reference
  useEffect(() => {
    if (iframeRef.current && previewContent) {
      webPreviewService.setPreviewFrame(iframeRef.current);
    }
  }, [previewContent]);

  const updatePreview = async () => {
    if (!webPreviewService.isWebProjectActive()) {
      console.log('Not a web project, skipping preview update');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      console.log('Updating preview with files:', files.length, 'selected:', selectedFile?.name);
      const content = await webPreviewService.generatePreview(files, selectedFile);
      
      if (content) {
        setPreviewContent(content);
        if (iframeRef.current) {
          iframeRef.current.srcdoc = content;
        }
        console.log('Preview updated successfully');
      } else {
        setError('Failed to generate preview content');
      }
    } catch (error) {
      console.error('Failed to update preview:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
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

  // Check if current project supports web preview
  const isWebProject = webPreviewService.isWebProjectActive();
  console.log('WebPreview render - isWebProject:', isWebProject, 'language:', language, 'framework:', framework);

  if (!isWebProject) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-editor-sidebar/50">
        <div className="text-center space-y-4 max-w-md">
          <Monitor className="h-16 w-16 text-editor-text-muted mx-auto opacity-50" />
          <div>
            <h3 className="text-xl font-medium text-editor-text mb-3">Web Preview Available</h3>
            <p className="text-sm text-editor-text-muted mb-4 leading-relaxed">
              Create a web project to see live preview of your code
            </p>
            <div className="text-xs text-editor-text-muted bg-editor-highlight p-4 rounded-lg">
              <div className="font-semibold mb-2">Supported Languages:</div>
              <div className="grid grid-cols-2 gap-2 text-left">
                <div>• JavaScript</div>
                <div>• TypeScript</div>
                <div>• HTML</div>
                <div>• CSS</div>
                <div>• React</div>
                <div>• Vue</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <Monitor className="h-5 w-5 text-blue-600" />
          <div>
            <span className="text-sm font-semibold text-gray-800">Live Preview</span>
            <div className="text-xs text-gray-500">
              {language} {framework && `• ${framework}`}
            </div>
          </div>
          {previewContent && !error && (
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 font-medium">Live</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 w-8 p-0"
            title="Refresh Preview"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenInNewTab}
            className="h-8 w-8 p-0"
            title="Open in New Tab"
            disabled={!previewContent}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVisibility}
            className="h-8 w-8 p-0"
            title={isVisible ? "Hide Preview" : "Show Preview"}
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Content */}
      {isVisible && (
        <div className="flex-1 relative">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />
                <p className="text-sm text-gray-600">Generating live preview...</p>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {error && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50">
              <div className="text-center max-w-md p-6">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-800 mb-2">Preview Error</h3>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <Button onClick={handleRefresh} className="bg-red-500 hover:bg-red-600">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {/* Empty State */}
          {!previewContent && !isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="text-center space-y-4 max-w-md p-6">
                <Play className="h-16 w-16 text-blue-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">Ready for Live Preview</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Your {language} code will appear here. Start coding or click the button below.
                  </p>
                  <Button onClick={handleRefresh} className="bg-blue-500 hover:bg-blue-600">
                    <Play className="h-4 w-4 mr-2" />
                    Generate Preview
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Preview Content */}
          {previewContent && !error && (
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              title="Live Web Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
              srcDoc={previewContent}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default WebPreview;
