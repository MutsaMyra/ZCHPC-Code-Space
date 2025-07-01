import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ServerStatusProps {
  language: string;
  isOnline: boolean;
}

const ServerStatus: React.FC<ServerStatusProps> = ({ language, isOnline }) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [serverInfo, setServerInfo] = useState({
    language: '',
    memory: '0 MB',
    cpuLoad: '0%',
  });

  // Reset connection status when going offline
  useEffect(() => {
    if (!isOnline && status !== 'disconnected') {
      disconnectFromServer();
    }
  }, [isOnline, status]);

  const connectToServer = () => {
    // Disabled - show tooltip instead
    return;
  };

  const disconnectFromServer = () => {
    // Disabled - show tooltip instead  
    return;
  };

  // Update server info when language changes
  useEffect(() => {
    if (status === 'connected') {
      setServerInfo(prev => ({
        ...prev,
        language,
      }));
    }
  }, [language, status]);

  return (
    <div className="p-3 bg-editor-sidebar border-t border-editor-border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Processing Server</h3>
        <Badge className={status === 'connected' ? 'bg-green-600' : status === 'connecting' ? 'bg-yellow-600' : 'bg-red-600'}>
          {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
        </Badge>
      </div>

      {status === 'connected' && (
        <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
          <div>
            <p className="text-gray-400">Language</p>
            <p>{serverInfo.language}</p>
          </div>
          <div>
            <p className="text-gray-400">Memory</p>
            <p>{serverInfo.memory}</p>
          </div>
          <div>
            <p className="text-gray-400">CPU</p>
            <p>{serverInfo.cpuLoad}</p>
          </div>
        </div>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={status !== 'connected' ? connectToServer : disconnectFromServer}
              className="w-full bg-editor-active hover:bg-blue-700 text-white opacity-50 cursor-not-allowed"
              variant="default"
              disabled
            >
              {status !== 'connected' ? 'Connect to Server' : 'Disconnect'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Feature coming soon</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ServerStatus;
