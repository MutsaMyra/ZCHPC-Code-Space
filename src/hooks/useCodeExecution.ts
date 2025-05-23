
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  ExecutionService, 
  executionService, 
  ExecutionConfig, 
  ExecutionResult 
} from '../services/executionService';
import { FileNode } from '../components/FileExplorer';

export const useCodeExecution = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [lastExecutionResult, setLastExecutionResult] = useState<ExecutionResult | null>(null);

  const runCode = async (
    selectedFile: FileNode | null, 
    selectedLanguage: string, 
    executionConfig: ExecutionConfig,
    isOnline: boolean
  ) => {
    if (!selectedFile) {
      toast.error('No file selected to run');
      return;
    }

    setIsRunning(true);
    setTerminalOutput([
      `[${new Date().toLocaleTimeString()}] Running ${selectedFile.name} in ${executionConfig.mode} mode using ${executionConfig.hardware.toUpperCase()}...`,
      isOnline ? 'Network connected: Remote execution available' : 'Network disconnected: Using local execution only'
    ]);

    try {
      const result = await executionService.executeCode(
        selectedFile.content || '',
        selectedLanguage,
        executionConfig
      );

      setLastExecutionResult(result);
      
      // Update terminal with execution results
      setTerminalOutput(prev => [
        ...prev,
        ...result.output,
        `[${new Date().toLocaleTimeString()}] Execution completed in ${result.executionTime.toFixed(2)}s with exit code ${result.exitCode}`
      ]);
      
      if (result.exitCode === 0) {
        toast.success('Code executed successfully', {
          description: `Completed in ${result.executionTime.toFixed(2)}s`
        });
      } else {
        toast.error('Execution failed', {
          description: result.errors?.[0] || 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Execution error:', error);
      setTerminalOutput(prev => [
        ...prev,
        `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      ]);
      toast.error('Execution error', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsRunning(false);
    }
  };

  return {
    isRunning,
    terminalOutput,
    lastExecutionResult,
    runCode,
    setTerminalOutput
  };
};
