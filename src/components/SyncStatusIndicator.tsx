
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
import { fileSystemService } from '../services/fileSystemService';
import { toast } from 'sonner';

interface SyncStatusIndicatorProps {
  isOnline: boolean;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ isOnline }) => {
  const [syncStatus, setSyncStatus] = useState(fileSystemService.getSyncStatus());
  const [queuedChanges, setQueuedChanges] = useState(fileSystemService.getQueuedChanges());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(fileSystemService.getSyncStatus());
      setQueuedChanges(fileSystemService.getQueuedChanges());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      toast.warning('Cannot sync while offline');
      return;
    }

    setIsSyncing(true);
    try {
      const success = await fileSystemService.forceSync();
      if (success) {
        setSyncStatus(fileSystemService.getSyncStatus());
        setQueuedChanges(fileSystemService.getQueuedChanges());
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-editor-sidebar border-t border-editor-border">
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-yellow-500" />
        )}
        <span className="text-xs text-editor-text-muted">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Sync Status */}
      <div className="flex items-center space-x-1">
        {isOnline ? (
          <Cloud className="h-4 w-4 text-blue-500" />
        ) : (
          <CloudOff className="h-4 w-4 text-gray-500" />
        )}
        <span className="text-xs text-editor-text-muted">
          Last sync: {formatLastSync(syncStatus.lastSyncTime)}
        </span>
      </div>

      {/* Queued Changes */}
      {queuedChanges > 0 && (
        <Badge variant="secondary" className="bg-yellow-600 text-yellow-100">
          {queuedChanges} changes pending
        </Badge>
      )}

      {/* Conflicts */}
      {syncStatus.conflictFiles.length > 0 && (
        <div className="flex items-center space-x-1 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs">{syncStatus.conflictFiles.length} conflicts</span>
        </div>
      )}

      {/* Sync Button */}
      {isOnline && (syncStatus.hasLocalChanges || queuedChanges > 0) && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="h-6 px-2 bg-editor-sidebar border-editor-border text-editor-text"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync'}
        </Button>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
