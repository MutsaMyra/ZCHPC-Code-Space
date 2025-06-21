
import React from 'react';
import { Button } from "@/components/ui/button";
import { Monitor, Play } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface WebPreviewButtonProps {
  isWebProject: boolean;
  isPreviewVisible: boolean;
  onTogglePreview: () => void;
  language?: string;
}

const WebPreviewButton: React.FC<WebPreviewButtonProps> = ({
  isWebProject,
  isPreviewVisible,
  onTogglePreview,
  language
}) => {
  if (!isWebProject) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={onTogglePreview}
        variant={isPreviewVisible ? "default" : "outline"}
        size="sm"
        className="flex items-center space-x-2"
      >
        <Monitor className="h-4 w-4" />
        <span>{isPreviewVisible ? 'Hide Preview' : 'Live Preview'}</span>
        {!isPreviewVisible && <Play className="h-3 w-3" />}
      </Button>
      {isPreviewVisible && (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Live
        </Badge>
      )}
    </div>
  );
};

export default WebPreviewButton;
