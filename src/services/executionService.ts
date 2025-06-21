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

// Enhanced Piston API configuration with all supported languages
const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

const PISTON_LANGUAGE_MAP: Record<string, { language: string; version: string; aliases?: string[] }> = {
  javascript: { language: 'javascript', version: '18.15.0', aliases: ['js', 'node'] },
  java: { language: 'java', version: '15.0.2' },
  php: { language: 'php', version: '8.2.3' },
  cpp: { language: 'cpp', version: '10.2.0', aliases: ['c++', 'cxx'] },
  python: { language: 'python', version: '3.10.0', aliases: ['py', 'python3'] },
};

export class ExecutionService {
  private static instance: ExecutionService;
  private isOnline: boolean = navigator.onLine;
  private executionCache: Map<string, any> = new Map();
  
  private constructor() {
    this.initializeListeners();
  }
  
  public static getInstance(): ExecutionService {
    if (!ExecutionService.instance) {
      ExecutionService.instance = new ExecutionService();
    }
    return ExecutionService.instance;
  }
  
  private initializeListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      toast.info('Connection restored. Online execution available.');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      toast.warning('Connection lost. Using offline simulation.');
    });
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
    config: ExecutionConfig,
    forceFresh: boolean = true
  ): Promise<ExecutionResult> {
    // Clear cache to ensure fresh execution
    if (forceFresh) {
      this.executionCache.clear();
      console.log('Execution cache cleared - ensuring fresh run');
    }
    
    const effectiveMode = config.autoDetect 
      ? this.getRecommendedMode() 
      : config.mode;
    
    console.log(`Fresh execution mode: ${effectiveMode}, Online: ${this.isOnline}, Language: ${language}`);
    
    if (!this.isOnline && effectiveMode === 'online') {
      toast.warning('No internet connection. Using offline simulation.');
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

    const normalizedLanguage = this.normalizeLanguage(language);
    const languageConfig = PISTON_LANGUAGE_MAP[normalizedLanguage];
    
    if (!languageConfig) {
      toast.error(`Language ${language} not supported by Piston. Using local simulation.`);
      return this.executeLocally(code, language, config);
    }

    try {
      const processedCode = this.preprocessCode(code, normalizedLanguage);
      const result = await this.submitToPiston(processedCode, languageConfig, normalizedLanguage);
      console.log('Piston execution result:', result);
      
      const executionTime = (performance.now() - startTime) / 1000;
      
      const output: string[] = [
        `[Piston] Executing ${language} code (fresh execution)...`,
        `[Piston] Language: ${languageConfig.language} v${languageConfig.version}`,
      ];

      // Handle compilation output first (for compiled languages)
      if (result.compile) {
        if (result.compile.stdout && result.compile.stdout.trim()) {
          output.push('--- Compilation Output ---');
          output.push(result.compile.stdout.trim());
        }
        if (result.compile.stderr && result.compile.stderr.trim()) {
          output.push('--- Compilation Errors ---');
          output.push(result.compile.stderr.trim());
        }
      }

      // Handle runtime output
      if (result.run) {
        if (result.run.stdout && result.run.stdout.trim()) {
          output.push('--- Program Output ---');
          output.push(result.run.stdout.trim());
        }
        if (result.run.stderr && result.run.stderr.trim()) {
          output.push('--- Runtime Errors ---');
          output.push(result.run.stderr.trim());
        }
      }

      const exitCode = result.run ? result.run.code : (result.compile ? result.compile.code : 1);
      output.push(`[Piston] Exit code: ${exitCode}`);

      const errors = [];
      if (result.compile?.stderr) errors.push(result.compile.stderr);
      if (result.run?.stderr) errors.push(result.run.stderr);

      return {
        output,
        executionTime,
        exitCode: exitCode || 0,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Piston execution error:', error);
      toast.error('Failed to execute on Piston. Using local simulation.');
      return this.executeLocally(code, language, config);
    }
  }

  private preprocessCode(code: string, language: string): string {
    switch (language) {
      case 'java':
        if (!code.includes('class') && !code.includes('public class')) {
          return `public class Main {
    public static void main(String[] args) {
        ${code}
    }
}`;
        }
        break;
      
      case 'cpp':
        if (!code.includes('#include')) {
          const includes = '#include <iostream>\nusing namespace std;\n\n';
          
          if (!code.includes('main')) {
            return `${includes}int main() {
    ${code}
    return 0;
}`;
          } else {
            return includes + code;
          }
        }
        break;
      
      case 'php':
        if (!code.trim().startsWith('<?php')) {
          return `<?php\n${code}`;
        }
        break;
    }
    
    return code;
  }

  private normalizeLanguage(language: string): string {
    const normalized = language.toLowerCase();
    
    if (PISTON_LANGUAGE_MAP[normalized]) {
      return normalized;
    }
    
    for (const [lang, config] of Object.entries(PISTON_LANGUAGE_MAP)) {
      if (config.aliases && config.aliases.includes(normalized)) {
        return lang;
      }
    }
    
    return normalized;
  }

  private async submitToPiston(
    code: string, 
    languageConfig: { language: string; version: string },
    originalLanguage: string
  ) {
    console.log('Submitting to Piston...', { 
      language: languageConfig.language, 
      version: languageConfig.version,
      codeLength: code.length 
    });
    
    const fileName = this.getFileName(originalLanguage);
    
    const requestBody = {
      language: languageConfig.language,
      version: languageConfig.version,
      files: [
        {
          name: fileName,
          content: code,
        },
      ],
      stdin: '',
      args: [],
      compile_timeout: 10000,
      run_timeout: 5000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    };

    console.log('Piston request body:', requestBody);
    
    const response = await fetch(`${PISTON_API_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Piston execution failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  private getFileName(language: string): string {
    const fileNames: Record<string, string> = {
      'javascript': 'main.js',
      'java': 'Main.java',
      'php': 'main.php',
      'cpp': 'main.cpp',
      'python': 'main.py',
    };
    return fileNames[language] || `main.${language}`;
  }
  
  private async executeLocally(
    code: string, 
    language: string, 
    config: ExecutionConfig
  ): Promise<ExecutionResult> {
    console.log("Executing locally (fresh)", { code: code.substring(0, 100) + '...', language, config });
    
    const output: string[] = [
      `[Local] Executing ${language} code on ${config.hardware.toUpperCase()} (fresh execution)...`,
      `[Local] Using ${navigator.hardwareConcurrency || config.cpuCores} available CPU cores`,
      `[Local] Browser: ${navigator.userAgent.split(' ')[0]}`,
    ];
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const normalizedLanguage = this.normalizeLanguage(language);
      
      switch (normalizedLanguage) {
        case 'javascript':
          output.push('[Local] Browser JavaScript environment');
          return this.executeJavaScript(code, output);
          
        case 'java':
          output.push('[Local] Simulating Java execution');
          return this.simulateJavaExecution(code, output);
          
        case 'php':
          output.push('[Local] Simulating PHP execution');
          return this.simulatePhpExecution(code, output);
          
        case 'cpp':
          output.push('[Local] Simulating C++ execution');
          return this.simulateCppExecution(code, output);
          
        case 'python':
          output.push('[Local] Simulating Python execution');
          return this.simulatePythonExecution(code, output);
          
        default:
          output.push(`[Local] Language ${language} - Basic simulation`);
          return this.simulateGenericExecution(code, output, language);
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
  
  private simulateGenericExecution(code: string, output: string[], language: string): ExecutionResult {
    output.push(`> [Simulated ${language} execution - fresh run]`);
    output.push('> Code processed successfully');
    
    if (code.includes('print') || code.includes('echo') || code.includes('cout') || code.includes('System.out')) {
      output.push('> [Output would appear here in real execution]');
    }
    
    return {
      output,
      executionTime: Math.random() * 0.3 + 0.1,
      exitCode: 0
    };
  }
}

export const executionService = ExecutionService.getInstance();
