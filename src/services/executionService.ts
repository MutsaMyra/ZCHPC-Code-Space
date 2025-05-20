
import { toast } from "sonner";

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
  
  public async executeCode(
    code: string, 
    language: string, 
    config: ExecutionConfig
  ): Promise<ExecutionResult> {
    // Determine execution mode based on config and connectivity
    const effectiveMode = config.autoDetect 
      ? this.getRecommendedMode() 
      : config.mode;
    
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
          output.push('Your console.log outputs would appear here');
        }
        break;
      case 'python':
        output.push('[Server] Python interpreter started');
        output.push('>>> Running script');
        if (code.includes('print')) {
          output.push('Your print statements would appear here');
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
    // In a real app, this would use WebAssembly, Web Workers, or other local execution methods
    console.log("Executing locally", { code, language, config });
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const output: string[] = [
      `[Local] Executing ${language} code on ${config.hardware.toUpperCase()}...`,
    ];
    
    // Add some sample output based on the language
    switch (language) {
      case 'javascript':
        output.push('[Local] Browser JavaScript environment');
        try {
          // This is just for demo - in a real app you'd use a safer execution environment
          const result = new Function(`
            const console = {
              log: function(...args) {
                return args.join(' ');
              }
            };
            return (function() { ${code} })();
          `)();
          
          if (result) {
            output.push(`Output: ${result}`);
          } else {
            output.push('Code executed successfully with no output');
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
        break;
      default:
        output.push(`[Local] Local execution of ${language} is limited in browser environment`);
        output.push('Consider using online mode for full language support');
    }
    
    return {
      output,
      executionTime: Math.random() * 0.5 + 0.1, // Random time between 0.1 and 0.6s
      exitCode: 0
    };
  }
}

export const executionService = ExecutionService.getInstance();
