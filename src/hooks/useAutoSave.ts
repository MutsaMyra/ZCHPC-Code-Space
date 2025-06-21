
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { FileNode } from '../components/FileExplorer';
import { localFileSystemService } from '../services/localFileSystemService';

export interface ActivityLogEntry {
  timestamp: Date;
  message: string;
  type: 'save' | 'error' | 'info';
}

export const useAutoSave = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const pendingChangesRef = useRef(false);

  useEffect(() => {
    setIsConfigured(localFileSystemService.hasSaveLocation());
  }, []);

  const saveFile = useCallback(async (file: FileNode) => {
    if (!file.content) return;
    
    try {
      const success = await localFileSystemService.saveFile(file.name, file.content);
      if (success) {
        const logEntry: ActivityLogEntry = {
          timestamp: new Date(),
          message: `Saved ${file.name}`,
          type: 'save'
        };
        setActivityLog(prev => [logEntry, ...prev].slice(0, 50));
        toast.success(`File saved: ${file.name}`);
      }
    } catch (error) {
      const logEntry: ActivityLogEntry = {
        timestamp: new Date(),
        message: `Failed to save ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      };
      setActivityLog(prev => [logEntry, ...prev].slice(0, 50));
      toast.error(`Failed to save ${file.name}`);
    }
  }, []);

  const saveProject = useCallback(async (files: FileNode[], projectName: string) => {
    try {
      const success = await localFileSystemService.saveProject(files, projectName);
      if (success) {
        const logEntry: ActivityLogEntry = {
          timestamp: new Date(),
          message: `Saved project: ${projectName}`,
          type: 'save'
        };
        setActivityLog(prev => [logEntry, ...prev].slice(0, 50));
      }
    } catch (error) {
      const logEntry: ActivityLogEntry = {
        timestamp: new Date(),
        message: `Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      };
      setActivityLog(prev => [logEntry, ...prev].slice(0, 50));
    }
  }, []);

  const configureSaveLocation = useCallback(async () => {
    try {
      const success = await localFileSystemService.promptForSaveLocation();
      if (success) {
        setIsConfigured(true);
        const logEntry: ActivityLogEntry = {
          timestamp: new Date(),
          message: 'Save location configured',
          type: 'info'
        };
        setActivityLog(prev => [logEntry, ...prev].slice(0, 50));
      }
      return success;
    } catch (error) {
      const logEntry: ActivityLogEntry = {
        timestamp: new Date(),
        message: `Failed to configure save location: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      };
      setActivityLog(prev => [logEntry, ...prev].slice(0, 50));
      return false;
    }
  }, []);

  const markPendingChanges = useCallback(() => {
    pendingChangesRef.current = true;
  }, []);

  return {
    saveFile,
    saveProject,
    configureSaveLocation,
    isConfigured,
    markPendingChanges,
    activityLog
  };
};
