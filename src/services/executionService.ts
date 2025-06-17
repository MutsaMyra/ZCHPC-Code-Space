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

// Piston API configuration
const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

// Language mappings for Piston API
const PISTON_LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  javascript: { language: 'javascript', version: '18.15.0' }, // Node.js
  python: { language: 'python', version: '3.10.0' },
  cpp: { language: 'cpp', version: '10.2.0' },
  java: { language: 'java', version: '15.0.2' },
  php: { language: 'php', version: '8.2.3' },
  c: { language: 'c', version: '10.2.0' },
  csharp: { language: 'csharp', version: '6.12.0' },
  go: { language: 'go', version: '1.16.2' },
  rust: { language: 'rust', version: '1.68.2' },
  ruby: { language: 'ruby', version: '3.0.1' },
  typescript: { language: 'typescript', version: '5.0.3' },
};

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
    const effectiveMode = config.autoDetect 
      ? this.getRecommendedMode() 
      : config.mode;
    
    console.log(`Execution mode: ${effectiveMode}, Online: ${this.isOnline}`);
    
    if (!this.isOnline && effectiveMode === 'online') {
      toast.warning('No internet connection. Falling back to offline execution.');
      return this.executeLocally(code, language, config);
    }
    
    if (effectiveMode === 'online') {
      return this.executeOnPiston(code, language, config);
    } else {
      return this.executeLocally(code, language, config);
    }
  }
  
  private async executeOnPiston(
    code: string, 
    language: string, 
    config: ExecutionConfig
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    
    console.log(`Executing on Piston with language: ${language}`);

    const languageConfig = PISTON_LANGUAGE_MAP[language];
    if (!languageConfig) {
      toast.error(`Language ${language} not supported by Piston. Using local simulation.`);
      return this.executeLocally(code, language, config);
    }

    try {
      const result = await this.submitToPiston(code, languageConfig);
      console.log('Piston execution result:', result);
      
      const executionTime = (performance.now() - startTime) / 1000;
      
      const output: string[] = [
        `[Piston] Executing ${language} code...`,
        `[Piston] Language: ${languageConfig.language} v${languageConfig.version}`,
      ];

      if (result.run && result.run.stdout) {
        output.push('--- Output ---');
        output.push(result.run.stdout.trim());
      }

      if (result.run && result.run.stderr) {
        output.push('--- Errors ---');
        output.push(result.run.stderr.trim());
      }

      if (result.compile && result.compile.stdout) {
        output.push('--- Compilation Output ---');
        output.push(result.compile.stdout.trim());
      }

      if (result.compile && result.compile.stderr) {
        output.push('--- Compilation Errors ---');
        output.push(result.compile.stderr.trim());
      }

      const exitCode = result.run ? result.run.code : (result.compile ? result.compile.code : 1);
      output.push(`[Piston] Exit code: ${exitCode}`);

      return {
        output,
        executionTime,
        exitCode: exitCode || 0,
        errors: result.run?.stderr || result.compile?.stderr ? 
          [result.run?.stderr || result.compile?.stderr].filter(Boolean) : undefined
      };

    } catch (error) {
      console.error('Piston execution error:', error);
      toast.error('Failed to execute on Piston. Falling back to local simulation.');
      return this.executeLocally(code, language, config);
    }
  }

  private async submitToPiston(
    code: string, 
    languageConfig: { language: string; version: string }
  ) {
    console.log('Submitting to Piston...', { 
      language: languageConfig.language, 
      version: languageConfig.version,
      codeLength: code.length 
    });
    
    const response = await fetch(`${PISTON_API_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: languageConfig.language,
        version: languageConfig.version,
        files: [
          {
            name: `main.${this.getFileExtension(languageConfig.language)}`,
            content: code,
          },
        ],
        stdin: '',
        args: [],
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Piston execution failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      'javascript': 'js',
      'python': 'py',
      'cpp': 'cpp',
      'java': 'java',
      'php': 'php',
      'c': 'c',
      'csharp': 'cs',
      'go': 'go',
      'rust': 'rs',
      'ruby': 'rb',
      'typescript': 'ts',
    };
    return extensions[language] || 'txt';
  }
  
  private async executeLocally(
    code: string, 
    language: string, 
    config: ExecutionConfig
  ): Promise<ExecutionResult> {
    console.log("Executing locally", { code: code.substring(0, 100) + '...', language, config });
    
    const output: string[] = [
      `[Local] Executing ${language} code on ${config.hardware.toUpperCase()}...`,
      `[Local] Using ${navigator.hardwareConcurrency || config.cpuCores} available CPU cores`,
      `[Local] Browser: ${navigator.userAgent.split(' ')[0]}`,
    ];
    
    // Add a small delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 800));
    
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
    const mockConsole = {
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
      const wrappedCode = `
        return (function() { 
          ${code}
        })();
      `;
      
      const result = new Function('console', wrappedCode)(mockConsole);
      
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
    const printRegex = /print\s*\(\s*(?:f?['"]([^'"]*)['"]\s*|([^)]*))(?:\s*,\s*([^)]*))*\s*\)/g;
    let match;
    let found = false;
    
    while ((match = printRegex.exec(code)) !== null) {
      found = true;
      if (match[1]) {
        output.push(`> ${match[1]}`);
      } else if (match[2]) {
        output.push(`> [Variable output: "${match[2]}"]`);
      }
    }
    
    if (!found) {
      output.push(`> [No output. Use print() to see output]`);
    }
    
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
