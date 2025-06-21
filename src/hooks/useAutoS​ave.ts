
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { localFileSystemService } from '../services/localFileSystemService';
import { FileNode } from '../components/FileExplorer';

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // in seconds
  saveLocation: string | null;
  showToasts: boolean;
}

export const useAutoSave = () => {
  const [config, setConfig] = useState<AutoSaveConfig>({
    enabled: true,
    interval: 30,
    saveLocation: null,
    showToasts: true
  });
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [activityLog, setActivityLog] = useState<Array<{
    timestamp: Date;
    action: string;
    file?: string;
    success: boolean;
  }>>([]);

  // Initialize save location on component mount
  useEffect(() => {
    const checkSaveLocation = async () => {
      if (!config.saveLocation && config.enabled) {
        const hasLocation = localFileSystemService.hasSaveLocation();
        if (!hasLocation) {
          const locationSet = await localFileSystemService.promptForSaveLocation();
          if (locationSet) {
            const location = localFileSystemService.getCurrentSaveLocation();
            setConfig(prev => ({ ...prev, saveLocation: location }));
            
            if (config.showToasts) {
              toast.success('Auto-save location configured');
            }
          }
        } else {
          const location = localFileSystemService.getCurrentSaveLocation();
          setConfig(prev => ({ ...prev, saveLocation: location }));
        }
      }
    };

    checkSaveLocation();
  }, [config.enabled, config.saveLocation, config.showToasts]);

  const addToActivityLog = useCallback((action: string, file?: string, success: boolean = true) => {
    const entry = {
      timestamp: new Date(),
      action,
      file,
      success
    };
    
    setActivityLog(prev => [entry, ...prev.slice(0, 49)]); // Keep last 50 entries
  }, []);

  const saveFile = useCallback(async (file: FileNode): Promise<boolean> => {
    if (!config.enabled || !file.content) return false;

    try {
      const success = await localFileSystemService.saveFile(file.name, file.content);
      
      if (success) {
        setLastSaved(new Date());
        setPendingChanges(false);
        addToActivityLog(`Saved ${file.name}`, file.name, true);
        
        if (config.showToasts) {
          toast.success(`Auto-saved: ${file.name}`, {
            duration: 2000
          });
        }
      } else {
        addToActivityLog(`Failed to save ${file.name}`, file.name, false);
        
        if (config.showToasts) {
          toast.error(`Auto-save failed: ${file.name}`);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Auto-save error:', error);
      addToActivityLog(`Error saving ${file.name}`, file.name, false);
      
      if (config.showToasts) {
        toast.error('Auto-save error occurred');
      }
      
      return false;
    }
  }, [config.enabled, config.showToasts, addToActivityLog]);

  const saveProject = useCallback(async (files: FileNode[], projectName: string): Promise<boolean> => {
    if (!config.enabled) return false;

    try {
      const success = await localFileSystemService.saveProject(files, projectName);
      
      if (success) {
        setLastSaved(new Date());
        setPendingChanges(false);
        addToActivityLog(`Saved project: ${projectName}`, undefined, true);
        
        if (config.showToasts) {
          toast.success(`Project auto-saved: ${projectName}`);
        }
      } else {
        addToActivityLog(`Failed to save project: ${projectName}`, undefined, false);
        
        if (config.showToasts) {
          toast.error(`Project auto-save failed: ${projectName}`);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Project auto-save error:', error);
      addToActivityLog(`Error saving project: ${projectName}`, undefined, false);
      
      if (config.showToasts) {
        toast.error('Project auto-save error occurred');
      }
      
      return false;
    }
  }, [config.enabled, config.showToasts, addToActivityLog]);

  // Mark changes as pending
  const markPendingChanges = useCallback(() => {
    setPendingChanges(true);
  }, []);

  // Configure auto-save settings
  const updateConfig = useCallback((newConfig: Partial<AutoSaveConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Set up save location
  const configureSaveLocation = useCallback(async (): Promise<boolean> => {
    const success = await localFileSystemService.promptForSaveLocation();
    if (success) {
      const location = localFileSystemService.getCurrentSaveLocation();
      setConfig(prev => ({ ...prev, saveLocation: location }));
      addToActivityLog('Save location configured', undefined, true);
      
      if (config.showToasts) {
        toast.success('Save location updated');
      }
    }
    return success;
  }, [config.showToasts, addToActivityLog]);

  return {
    config,
    lastSaved,
    pendingChanges,
    activityLog,
    saveFile,
    saveProject,
    markPendingChanges,
    updateConfig,
    configureSaveLocation,
    isConfigured: !!config.saveLocation
  };
};
