
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

    if (!selectedFile.content || selectedFile.content.trim() === '') {
      toast.error('The file is empty');
      return;
    }

    setIsRunning(true);
    
    // Clear terminal and cache before execution
    setTerminalOutput([
      `[${new Date().toLocaleTimeString()}] Clearing runtime cache and preparing fresh execution...`,
      `[${new Date().toLocaleTimeString()}] Running ${selectedFile.name} in ${executionConfig.mode} mode using ${executionConfig.hardware.toUpperCase()}...`,
      isOnline ? 'Network connected: Remote execution available' : 'Network disconnected: Using local execution only'
    ]);

    try {
      // Force local execution when offline
      const effectiveConfig = {
        ...executionConfig,
        mode: isOnline ? executionConfig.mode : 'offline'
      };

      console.log(`Executing fresh code: ${selectedFile.content.substring(0, 100)}...`);
      
      // Always pass the current file content directly to ensure latest version
      const result = await executionService.executeCode(
        selectedFile.content, // Always use current content
        selectedLanguage,
        effectiveConfig,
        true // Force fresh execution
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

  const clearTerminal = () => {
    setTerminalOutput([]);
  };

  return {
    isRunning,
    terminalOutput,
    lastExecutionResult,
    runCode,
    clearTerminal,
    setTerminalOutput
  };
};
