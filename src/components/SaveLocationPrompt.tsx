
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderOpen, Save } from 'lucide-react';
import { localFileSystemService } from '../services/localFileSystemService';
import { toast } from 'sonner';

interface SaveLocationPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLocationSet: () => void;
  projectName: string;
}

const SaveLocationPrompt: React.FC<SaveLocationPromptProps> = ({
  isOpen,
  onClose,
  onSaveLocationSet,
  projectName
}) => {
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelectLocation = async () => {
    setIsSelecting(true);
    try {
      const success = await localFileSystemService.promptForSaveLocation();
      if (success) {
        toast.success('Save location selected successfully');
        onSaveLocationSet();
        onClose();
      }
    } catch (error) {
      console.error('Failed to select save location:', error);
      toast.error('Failed to select save location');
    } finally {
      setIsSelecting(false);
    }
  };

  const handleRemindLater = () => {
    toast.info('You can set save location anytime from the File menu');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Choose Save Location
          </DialogTitle>
          <DialogDescription>
            Select where you'd like to save your "{projectName}" project files on your local machine.
            This ensures your work is automatically backed up.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={handleSelectLocation}
            disabled={isSelecting}
            className="flex items-center gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            {isSelecting ? 'Selecting...' : 'Choose Folder'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleRemindLater}
            disabled={isSelecting}
          >
            Remind Me Later
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          Note: You can always change the save location later from the File menu.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveLocationPrompt;
