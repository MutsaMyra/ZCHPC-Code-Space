
import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { projectManager } from '../services/projectManager';
import { FileNode } from '../components/FileExplorer';

interface UseAutoSaveOptions {
  enabled: boolean;
  delay: number; // milliseconds
  onSave?: () => void;
}

export const useAutoSave = (
  files: FileNode[],
  projectId: string | null,
  options: UseAutoSaveOptions = { enabled: true, delay: 2000 }
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const isSavingRef = useRef(false);

  const saveFiles = useCallback(async () => {
    if (!projectId || !files || isSavingRef.current) return;

    const currentState = JSON.stringify(files);
    if (currentState === lastSavedRef.current) return;

    isSavingRef.current = true;
    
    try {
      projectManager.updateProjectFiles(projectId, files);
      lastSavedRef.current = currentState;
      
      // Show a subtle save indicator
      toast.success('Auto-saved', {
        duration: 1000,
        position: 'bottom-right',
      });
      
      options.onSave?.();
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error('Auto-save failed');
    } finally {
      isSavingRef.current = false;
    }
  }, [files, projectId, options]);

  const debouncedSave = useCallback(() => {
    if (!options.enabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(saveFiles, options.delay);
  }, [saveFiles, options.enabled, options.delay]);

  useEffect(() => {
    if (options.enabled && files && projectId) {
      debouncedSave();
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [files, debouncedSave, options.enabled, projectId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveFiles();
  }, [saveFiles]);

  return {
    forceSave,
    isSaving: isSavingRef.current,
  };
};
