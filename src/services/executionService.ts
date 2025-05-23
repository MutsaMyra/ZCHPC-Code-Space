
import { toast } from "sonner";
import { fileSystemService } from "./fileSystemService";

export type ExecutionMode = 'online' | 'offline';
export type HardwareType = 'cpu' | 'gpu';

export interface ExecutionConfig {
  mode: ExecutionMode;
  hardware: HardwareType;
  cpuCores: number;
  gpuMemory: number;
  autoDetect: boolean;
  timeout: number;
}

export interface ExecutionResult {
  output: string[];
  executionTime: number;
  exitCode: number;
  errors?: string[];
}

export class ExecutionService {
  private static instance: ExecutionService;
  private isOnline: boolean = navigator.onLine;
  
  private constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      toast.info('Connection restored. Switched to online mode.');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      toast.warning('Connection lost. Switched to offline mode.');
    });
  }
  
  public static getInstance(): ExecutionService {
    if (!ExecutionService.instance) {
      ExecutionService.instance = new ExecutionService();
    }
    return ExecutionService.instance;
  }
  
  public getRecommendedMode(): ExecutionMode {
    return this.isOnline ? 'online' : 'offline';
  }

  public getConnectionStatus(): boolean {
    return this.isOnline;
  }
  
  public async executeCode(
    code: string, 
    language: string, 
    config: ExecutionConfig
  ): Promise<ExecutionResult> {
    // Determine execution mode based on config and connectivity
    const effectiveMode = config.autoDetect 
      ? this.getRecommendedMode() 
      : config.mode;
    
    // Force offline mode if not connected, regardless of settings
    if (!this.isOnline && effectiveMode === 'online') {
      toast.warning('No internet connection. Falling back to offline execution.');
      return this.executeLocally(code, language, config);
    }
    
    if (effectiveMode === 'online') {
      return this.executeOnRemoteServer(code, language, config);
    } else {
      return this.executeLocally(code, language, config);
    }
  }
  
  private async executeOnRemoteServer(
    code: string, 
    language: string, 
    config: ExecutionConfig
  ): Promise<ExecutionResult> {
    // This would be a real API call in production
    console.log("Executing on remote server", { code, language, config });
    
    // Simulate network delay and processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock result based on language
    const output: string[] = [
      `[Server] Executing ${language} code on ${config.hardware.toUpperCase()}...`,
      `[Server] Allocated ${config.hardware === 'cpu' ? `${config.cpuCores} cores` : `${config.gpuMemory}GB GPU memory`}`,
    ];
    
    // Add some sample output based on the language
    switch (language) {
      case 'javascript':
        output.push('[Server] Node.js environment detected');
        output.push('Hello from the server!');
        if (code.includes('console.log')) {
          const logMatches = code.match(/console\.log\(['"]?(.*?)['"]?\)/g);
          if (logMatches) {
            logMatches.forEach(match => {
              const content = match.match(/console\.log\(['"]?(.*?)['"]?\)/)?.[1] || '';
              output.push(`> ${content}`);
            });
          }
        }
        break;
      case 'python':
        output.push('[Server] Python interpreter started');
        output.push('>>> Running script');
        if (code.includes('print')) {
          const printMatches = code.match(/print\(['"]?(.*?)['"]?\)/g);
          if (printMatches) {
            printMatches.forEach(match => {
              const content = match.match(/print\(['"]?(.*?)['"]?\)/)?.[1] || '';
              output.push(`> ${content}`);
            });
          }
        }
        break;
      default:
        output.push(`[Server] Executing ${language} code`);
        output.push('Execution complete');
    }
    
    return {
      output,
      executionTime: Math.random() * 1.5 + 0.5, // Random time between 0.5 and 2s
      exitCode: 0
    };
  }
  
  private async executeLocally(
    code: string, 
    language: string, 
    config: ExecutionConfig
  ): Promise<ExecutionResult> {
    console.log("Executing locally", { code, language, config });
    
    // Start with basic info about execution environment
    const output: string[] = [
      `[Local] Executing ${language} code on ${config.hardware.toUpperCase()}...`,
      `[Local] Using ${navigator.hardwareConcurrency || config.cpuCores} available CPU cores`,
      `[Local] Browser: ${navigator.userAgent}`,
    ];
    
    // Simulate brief processing delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    try {
      switch (language) {
        case 'javascript':
          output.push('[Local] Browser JavaScript environment');
          return this.executeJavaScript(code, output);
          
        case 'python':
          output.push('[Local] Simulating Python execution in browser environment');
          return this.simulatePythonExecution(code, output);
          
        case 'cpp':
          output.push('[Local] Simulating C++ execution in browser environment');
          return this.simulateCppExecution(code, output);
          
        case 'java':
          output.push('[Local] Simulating Java execution in browser environment');
          return this.simulateJavaExecution(code, output);
          
        case 'php':
          output.push('[Local] Simulating PHP execution in browser environment');
          return this.simulatePhpExecution(code, output);
          
        default:
          output.push(`[Local] Unsupported language: ${language}`);
          output.push('Consider using online mode for full language support');
          return {
            output,
            executionTime: 0.1,
            exitCode: 1,
            errors: [`Unsupported language: ${language}`]
          };
      }
    } catch (error) {
      output.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        output,
        executionTime: 0.1,
        exitCode: 1,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  
  private executeJavaScript(code: string, output: string[]): ExecutionResult {
    const startTime = performance.now();
    const console = {
      log: (...args: any[]) => {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        output.push(`> ${message}`);
        return message;
      },
      error: (...args: any[]) => {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        output.push(`Error: ${message}`);
        return message;
      },
      warn: (...args: any[]) => {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        output.push(`Warning: ${message}`);
        return message;
      },
      info: (...args: any[]) => {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        output.push(`Info: ${message}`);
        return message;
      }
    };
    
    try {
      // This is just for demo - in a real app you'd use a safer execution environment
      const wrappedCode = `
        return (function() { 
          ${code}
        })();
      `;
      
      const result = new Function('console', wrappedCode)(console);
      
      if (result !== undefined && typeof result !== 'function') {
        output.push(`Return value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`);
      }
      
      const executionTime = (performance.now() - startTime) / 1000;
      
      return {
        output,
        executionTime,
        exitCode: 0
      };
    } catch (error) {
      output.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
      const executionTime = (performance.now() - startTime) / 1000;
      
      return {
        output,
        executionTime,
        exitCode: 1,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  
  private simulatePythonExecution(code: string, output: string[]): ExecutionResult {
    // Extract print statements from Python code
    const printRegex = /print\s*\(\s*(?:f?['"]([^'"]*)['"]\s*|([^)]*))(?:\s*,\s*([^)]*))*\s*\)/g;
    let match;
    let found = false;
    
    while ((match = printRegex.exec(code)) !== null) {
      found = true;
      if (match[1]) {
        // Handle string literals
        output.push(`> ${match[1]}`);
      } else if (match[2]) {
        // Handle variables, simple expressions
        output.push(`> [Variable output: "${match[2]}"]`);
      }
    }
    
    if (!found) {
      output.push(`> [No output. Use print() to see output]`);
    }
    
    // Add some basic syntax detection
    if (code.includes('import ')) {
      output.push('> [Modules imported successfully]');
    }
    
    if (code.includes('def ')) {
      output.push('> [Functions defined successfully]');
    }
    
    if (code.includes('class ')) {
      output.push('> [Classes defined successfully]');
    }
    
    return {
      output,
      executionTime: Math.random() * 0.3 + 0.1,
      exitCode: 0
    };
  }
  
  private simulateCppExecution(code: string, output: string[]): ExecutionResult {
    // Extract cout statements from C++ code
    const coutRegex = /cout\s*<<\s*["\']?([^"\'<;]*)["\']?/g;
    let match;
    let found = false;
    
    while ((match = coutRegex.exec(code)) !== null) {
      found = true;
      output.push(`> ${match[1]}`);
    }
    
    if (!found) {
      output.push(`> [No output. Use cout << "text" to see output]`);
    }
    
    // Add some basic syntax detection
    if (code.includes('#include')) {
      output.push('> [Headers included successfully]');
    }
    
    if (code.includes('int main')) {
      output.push('> [Program executed with return code 0]');
    }
    
    return {
      output,
      executionTime: Math.random() * 0.2 + 0.1,
      exitCode: 0
    };
  }
  
  private simulateJavaExecution(code: string, output: string[]): ExecutionResult {
    // Extract System.out.println statements from Java code
    const printlnRegex = /System\.out\.println\s*\(\s*["\']([^"\']*)["\']?\s*\)/g;
    let match;
    let found = false;
    
    while ((match = printlnRegex.exec(code)) !== null) {
      found = true;
      output.push(`> ${match[1]}`);
    }
    
    if (!found) {
      output.push(`> [No output. Use System.out.println("text") to see output]`);
    }
    
    // Add some basic syntax detection
    if (code.includes('public class')) {
      output.push('> [Class compiled successfully]');
    }
    
    if (code.includes('public static void main')) {
      output.push('> [Program executed with exit code 0]');
    }
    
    return {
      output,
      executionTime: Math.random() * 0.4 + 0.2,
      exitCode: 0
    };
  }
  
  private simulatePhpExecution(code: string, output: string[]): ExecutionResult {
    // Extract echo statements from PHP code
    const echoRegex = /echo\s+["\']([^"\']*)["\']?\s*;/g;
    let match;
    let found = false;
    
    while ((match = echoRegex.exec(code)) !== null) {
      found = true;
      output.push(`> ${match[1]}`);
    }
    
    if (!found) {
      output.push(`> [No output. Use echo "text"; to see output]`);
    }
    
    // Add some basic syntax detection
    if (code.includes('<?php')) {
      output.push('> [PHP script processed]');
    }
    
    if (code.includes('function')) {
      output.push('> [Functions defined successfully]');
    }
    
    return {
      output,
      executionTime: Math.random() * 0.3 + 0.1,
      exitCode: 0
    };
  }
}

export const executionService = ExecutionService.getInstance();
