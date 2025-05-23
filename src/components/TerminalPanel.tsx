
import React from 'react';
import Terminal from './Terminal';
import { Badge } from '@/components/ui/badge';
import { ExecutionConfig } from '../services/executionService';

interface TerminalPanelProps {
  terminalOutput: string[];
  isRunning: boolean;
  executionConfig: ExecutionConfig;
  isOnline: boolean;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ 
  terminalOutput, 
  isRunning, 
  executionConfig,
  isOnline
}) => {
  return (
    <div className="p-4 h-full border-t border-editor-border overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Output</h3>
        <div className="flex space-x-2">
          {executionConfig.mode === 'online' && isOnline ? (
            <Badge className="bg-blue-600">ONLINE</Badge>
          ) : (
            <Badge className="bg-green-600">LOCAL</Badge>
          )}
          <Badge className="bg-editor-sidebar">
            {executionConfig.hardware.toUpperCase()} 
            {executionConfig.hardware === 'cpu' 
              ? ` (${executionConfig.cpuCores} cores)` 
              : ` (${executionConfig.gpuMemory} GB)`}
          </Badge>
        </div>
      </div>
      <div className="h-[calc(100%-30px)]">
        <Terminal output={terminalOutput} isRunning={isRunning} />
      </div>
    </div>
  );
};

export default TerminalPanel;
