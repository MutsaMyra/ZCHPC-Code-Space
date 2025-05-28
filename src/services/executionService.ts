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

// Judge0 API configuration
const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com';

// Language ID mappings for Judge0
const JUDGE0_LANGUAGE_MAP: Record<string, number> = {
  javascript: 63, // Node.js
  python: 71,     // Python 3
  cpp: 54,        // C++ (GCC 9.2.0)
  java: 62,       // Java (OpenJDK 13.0.1)
  php: 68,        // PHP (7.4.1)
  c: 50,          // C (GCC 9.2.0)
  csharp: 51,     // C# (Mono 6.6.0.161)
  go: 60,         // Go (1.13.5)
  rust: 73,       // Rust (1.40.0)
  ruby: 72,       // Ruby (2.7.0)
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

  private getApiKey(): string | null {
    return localStorage.getItem('judge0_api_key');
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
      const apiKey = this.getApiKey();
      if (!apiKey) {
        toast.warning('Judge0 API key not configured. Using local simulation. Click "API Setup" to configure.');
        return this.executeLocally(code, language, config);
      }
      return this.executeOnJudge0(code, language, config, apiKey);
    } else {
      return this.executeLocally(code, language, config);
    }
  }
  
  private async executeOnJudge0(
    code: string, 
    language: string, 
    config: ExecutionConfig,
    apiKey: string
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    
    console.log(`Executing on Judge0 with language: ${language}`);

    const languageId = JUDGE0_LANGUAGE_MAP[language];
    if (!languageId) {
      toast.error(`Language ${language} not supported by Judge0. Using local simulation.`);
      return this.executeLocally(code, language, config);
    }

    try {
      // Submit code for execution
      const submission = await this.submitToJudge0(code, languageId, apiKey);
      console.log('Submission created:', submission);
      
      // Poll for results
      const result = await this.pollJudge0Result(submission.token, apiKey);
      console.log('Execution result:', result);
      
      const executionTime = (performance.now() - startTime) / 1000;
      
      const output: string[] = [
        `[Judge0] Executing ${language} code...`,
        `[Judge0] Language ID: ${languageId}`,
        `[Judge0] Submission ID: ${submission.token}`,
      ];

      if (result.stdout) {
        output.push('--- Output ---');
        output.push(result.stdout.trim());
      }

      if (result.stderr) {
        output.push('--- Errors ---');
        output.push(result.stderr.trim());
      }

      if (result.compile_output) {
        output.push('--- Compilation ---');
        output.push(result.compile_output.trim());
      }

      const statusDescription = this.getStatusDescription(result.status?.id);
      output.push(`[Judge0] Status: ${statusDescription}`);

      return {
        output,
        executionTime: result.time ? parseFloat(result.time) : executionTime,
        exitCode: result.status?.id === 3 ? 0 : (result.status?.id || 1),
        errors: result.stderr ? [result.stderr] : undefined
      };

    } catch (error) {
      console.error('Judge0 execution error:', error);
      toast.error('Failed to execute on Judge0. Falling back to local simulation.');
      return this.executeLocally(code, language, config);
    }
  }

  private getStatusDescription(statusId?: number): string {
    const statusMap: Record<number, string> = {
      1: 'In Queue',
      2: 'Processing',
      3: 'Accepted',
      4: 'Wrong Answer',
      5: 'Time Limit Exceeded',
      6: 'Compilation Error',
      7: 'Runtime Error (SIGSEGV)',
      8: 'Runtime Error (SIGXFSZ)',
      9: 'Runtime Error (SIGFPE)',
      10: 'Runtime Error (SIGABRT)',
      11: 'Runtime Error (NZEC)',
      12: 'Runtime Error (Other)',
      13: 'Internal Error',
      14: 'Exec Format Error'
    };
    return statusMap[statusId || 0] || 'Unknown';
  }

  private async submitToJudge0(code: string, languageId: number, apiKey: string) {
    console.log('Submitting to Judge0...', { languageId, codeLength: code.length });
    
    const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        'X-RapidAPI-Key': apiKey,
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Judge0 submission failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async pollJudge0Result(token: string, apiKey: string, maxAttempts: number = 10): Promise<any> {
    console.log('Polling Judge0 result...', { token, maxAttempts });
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Judge0 polling failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`Poll attempt ${attempt + 1}:`, result.status);

      // Status 1 = In Queue, Status 2 = Processing
      if (result.status?.id > 2) {
        return result;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Judge0 execution timeout');
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
