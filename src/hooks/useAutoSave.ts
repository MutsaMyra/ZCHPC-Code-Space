
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { FileNode } from '../components/FileExplorer';
import { localFileSystemService } from '../services/localFileSystemService';

export interface ActivityLogEntry {
  timestamp: Date;
  message: string;
  type: 'save' | 'error' | 'info';
}

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // in milliseconds
  saveOnChange: boolean;
  showNotifications: boolean;
}

export const useAutoSave = (initialConfig?: Partial<AutoSaveConfig>) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [config, setConfig] = useState<AutoSaveConfig>({
    enabled: true,
    interval: 30000, // 30 seconds
    saveOnChange: false,
    showNotifications: true,
    ...initialConfig
  });
  
  const pendingChangesRef = useRef(false);
  const lastSaveRef = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentFileRef = useRef<FileNode | null>(null);

  useEffect(() => {
    setIsConfigured(localFileSystemService.hasSaveLocation());
  }, []);

  // Auto-save interval
  useEffect(() => {
    if (config.enabled && config.interval > 0) {
      intervalRef.current = setInterval(() => {
        if (pendingChangesRef.current && currentFileRef.current) {
          autoSaveFile(currentFileRef.current);
        }
      }, config.interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [config.enabled, config.interval]);

  const addLogEntry = useCallback((message: string, type: ActivityLogEntry['type'] = 'info') => {
    const logEntry: ActivityLogEntry = {
      timestamp: new Date(),
      message,
      type
    };
    setActivityLog(prev => [logEntry, ...prev].slice(0, 50));
  }, []);

  const autoSaveFile = useCallback(async (file: FileNode) => {
    if (!file.content || !config.enabled) return;
    
    try {
      const success = await localFileSystemService.saveFile(file.name, file.content);
      if (success) {
        pendingChangesRef.current = false;
        lastSaveRef.current = new Date();
        addLogEntry(`Auto-saved ${file.name}`, 'save');
        
        if (config.showNotifications) {
          toast.success(`Auto-saved: ${file.name}`, {
            duration: 2000,
            style: { fontSize: '12px' }
          });
        }
      }
    } catch (error) {
      addLogEntry(`Failed to auto-save ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      
      if (config.showNotifications) {
        toast.error(`Auto-save failed: ${file.name}`);
      }
    }
  }, [config.enabled, config.showNotifications, addLogEntry]);

  const saveFile = useCallback(async (file: FileNode) => {
    if (!file.content) return;
    
    try {
      const success = await localFileSystemService.saveFile(file.name, file.content);
      if (success) {
        pendingChangesRef.current = false;
        lastSaveRef.current = new Date();
        addLogEntry(`Saved ${file.name}`, 'save');
        toast.success(`File saved: ${file.name}`);
      }
    } catch (error) {
      addLogEntry(`Failed to save ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      toast.error(`Failed to save ${file.name}`);
    }
  }, [addLogEntry]);

  const saveProject = useCallback(async (files: FileNode[], projectName: string) => {
    try {
      const success = await localFileSystemService.saveProject(files, projectName);
      if (success) {
        pendingChangesRef.current = false;
        lastSaveRef.current = new Date();
        addLogEntry(`Saved project: ${projectName}`, 'save');
        toast.success(`Project saved: ${projectName}`);
      }
    } catch (error) {
      addLogEntry(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      toast.error(`Failed to save project: ${projectName}`);
    }
  }, [addLogEntry]);

  const configureSaveLocation = useCallback(async () => {
    try {
      const success = await localFileSystemService.promptForSaveLocation();
      if (success) {
        setIsConfigured(true);
        addLogEntry('Save location configured', 'info');
        toast.success('Save location configured');
      }
      return success;
    } catch (error) {
      addLogEntry(`Failed to configure save location: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      toast.error('Failed to configure save location');
      return false;
    }
  }, [addLogEntry]);

  const markPendingChanges = useCallback((file?: FileNode) => {
    pendingChangesRef.current = true;
    if (file) {
      currentFileRef.current = file;
      
      // Save immediately if saveOnChange is enabled
      if (config.enabled && config.saveOnChange) {
        autoSaveFile(file);
      }
    }
  }, [config.enabled, config.saveOnChange, autoSaveFile]);

  const updateConfig = useCallback((newConfig: Partial<AutoSaveConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const getStatus = useCallback(() => {
    return {
      hasPendingChanges: pendingChangesRef.current,
      lastSave: lastSaveRef.current,
      autoSaveEnabled: config.enabled,
      isConfigured
    };
  }, [config.enabled, isConfigured]);

  return {
    saveFile,
    saveProject,
    configureSaveLocation,
    markPendingChanges,
    updateConfig,
    getStatus,
    isConfigured,
    activityLog,
    config
  };
};
