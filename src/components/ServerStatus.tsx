
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";

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
    if (!isOnline) return;
    
    setStatus('connecting');
    
    // Simulate connection delay
    setTimeout(() => {
      setStatus('connected');
      setServerInfo({
        language,
        memory: `${Math.floor(Math.random() * 512) + 256} MB`,
        cpuLoad: `${Math.floor(Math.random() * 30) + 10}%`,
      });
    }, 1500);
  };

  const disconnectFromServer = () => {
    setStatus('disconnected');
    setServerInfo({
      language: '',
      memory: '0 MB',
      cpuLoad: '0%',
    });
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

      {isOnline ? (
        <Button 
          onClick={status !== 'connected' ? connectToServer : disconnectFromServer}
          className="w-full bg-editor-active hover:bg-blue-700 text-white"
          variant="default"
        >
          {status !== 'connected' ? 'Connect to Server' : 'Disconnect'}
        </Button>
      ) : (
        <Button 
          disabled
          className="w-full bg-gray-600 text-gray-300 cursor-not-allowed"
          variant="default"
        >
          Offline Mode - Server Unavailable
        </Button>
      )}
    </div>
  );
};

export default ServerStatus;
