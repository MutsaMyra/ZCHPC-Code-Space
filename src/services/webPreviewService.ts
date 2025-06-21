import { FileNode } from '../components/FileExplorer';
import { toast } from 'sonner';

export interface PreviewConfig {
  port?: number;
  autoRefresh: boolean;
  showConsole: boolean;
}

class WebPreviewService {
  private static instance: WebPreviewService;
  private previewFrame: HTMLIFrameElement | null = null;
  private previewContent: string = '';
  private isWebProject: boolean = false;
  private currentLanguage: string = '';
  private currentFramework: string = '';

  private constructor() {}

  public static getInstance(): WebPreviewService {
    if (!WebPreviewService.instance) {
      WebPreviewService.instance = new WebPreviewService();
    }
    return WebPreviewService.instance;
  }

  public setProjectContext(language: string, framework: string): void {
    this.currentLanguage = language.toLowerCase();
    this.currentFramework = framework;
    this.isWebProject = this.detectWebProject(this.currentLanguage, framework);
    console.log('Web preview context set:', { language: this.currentLanguage, framework, isWebProject: this.isWebProject });
  }

  public isWebProjectActive(): boolean {
    return this.isWebProject;
  }

  private detectWebProject(language: string, framework: string): boolean {
    const webLanguages = ['javascript', 'typescript', 'html', 'css', 'php'];
    const webFrameworks = ['React', 'Vue', 'Express', 'Laravel', 'Django', 'Flask', 'FastAPI', 'Vanilla'];
    
    const isWeb = webLanguages.includes(language) || webFrameworks.includes(framework);
    console.log('Detecting web project:', { language, framework, webLanguages, webFrameworks, isWeb });
    return isWeb;
  }

  public async generatePreview(files: FileNode[], selectedFile: FileNode | null): Promise<string | null> {
    if (!this.isWebProject) {
      console.log('Not a web project, skipping preview generation');
      return null;
    }

    console.log('Generating preview for:', { language: this.currentLanguage, framework: this.currentFramework, filesCount: files.length });

    try {
      switch (this.currentLanguage) {
        case 'javascript':
        case 'typescript':
          return this.generateJavaScriptPreview(files, selectedFile);
        case 'html':
          return this.generateHtmlPreview(files, selectedFile);
        case 'php':
          return this.generatePhpPreview(files, selectedFile);
        case 'python':
          return this.generatePythonWebPreview(files, selectedFile);
        default:
          return this.generateGenericWebPreview(files, selectedFile);
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
      toast.error('Failed to generate web preview');
      return null;
    }
  }

  private generateJavaScriptPreview(files: FileNode[], selectedFile: FileNode | null): string {
    console.log('Generating JavaScript preview');
    
    if (this.currentFramework === 'React') {
      return this.generateReactPreview(files, selectedFile);
    }

    const htmlFile = this.findFileByName(files, 'index.html') || this.findFileByExtension(files, '.html');
    const cssFiles = this.findFilesByExtension(files, '.css');
    const jsFiles = this.findFilesByExtension(files, '.js');

    let html = htmlFile?.content || `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JavaScript Preview</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            text-align: center; 
        }
        .code-preview {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 JavaScript Project Preview</h1>
        <p>Your JavaScript code is running live!</p>
        <div id="app"></div>
        <div id="output"></div>
    </div>
</body>
</html>
    `.trim();

    // Inject CSS
    cssFiles.forEach(file => {
      if (file.content) {
        html = html.replace('</head>', `<style>\n${file.content}\n</style>\n</head>`);
      }
    });

    // Inject JavaScript with better error handling
    const jsContent = jsFiles.map(file => file.content || '').join('\n\n');
    if (jsContent || selectedFile?.content) {
      const codeToRun = selectedFile?.content || jsContent;
      html = html.replace('</body>', `
        <script>
          try {
            // Override console.log to show output on page
            const originalLog = console.log;
            const outputDiv = document.getElementById('output');
            console.log = function(...args) {
              originalLog.apply(console, args);
              if (outputDiv) {
                const p = document.createElement('p');
                p.textContent = args.join(' ');
                p.style.cssText = 'background: rgba(255,255,255,0.2); padding: 10px; margin: 5px 0; border-radius: 5px;';
                outputDiv.appendChild(p);
              }
            };
            
            ${codeToRun}
          } catch (error) {
            console.error('JavaScript Error:', error);
            document.getElementById('output').innerHTML = '<div style="color: #ff6b6b; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 5px;"><strong>Error:</strong> ' + error.message + '</div>';
          }
        </script>
      </body>`);
    }

    return html;
  }

  private generateHtmlPreview(files: FileNode[], selectedFile: FileNode | null): string {
    const htmlContent = selectedFile?.content || this.findFileByExtension(files, '.html')?.content;
    
    if (!htmlContent) {
      return `
<!DOCTYPE html>
<html>
<head>
    <title>HTML Preview</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0; }
        .preview-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="preview-container">
        <h1>📄 HTML Preview</h1>
        <p>Create or select an HTML file to see the preview.</p>
    </div>
</body>
</html>
      `;
    }

    return htmlContent;
  }

  private generateReactPreview(files: FileNode[], selectedFile: FileNode | null): string {
    console.log('Generating React preview');
    
    const jsxContent = selectedFile?.content || this.findMainReactFile(files)?.content;
    
    if (!jsxContent) {
      return `
<!DOCTYPE html>
<html>
<head>
    <title>React Preview</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f2f5; }
        .react-container { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div id="root">
        <div class="react-container">
            <h1>⚛️ React Project Preview</h1>
            <p>Create or select a React component file (App.js, App.jsx) to see the preview.</p>
            <p>Your React components will render here automatically!</p>
        </div>
    </div>
</body>
</html>
      `;
    }

    const exampleCode = `function App() {
  return (
    <div>
      <h1>Hello React!</h1>
      <p>Your component content here</p>
    </div>
  );
}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>React Preview</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f0f2f5; }
        #root { min-height: 100vh; }
        .error { color: #d73a49; background: #ffeef0; border: 1px solid #fdb8c0; padding: 15px; margin: 20px; border-radius: 6px; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        try {
            ${jsxContent}
            
            // Try to render the component
            const rootElement = document.getElementById('root');
            const root = ReactDOM.createRoot(rootElement);
            
            if (typeof App !== 'undefined') {
                root.render(<App />);
            } else {
                // Look for other exported components
                const componentNames = ['Component', 'Main', 'HomePage', 'Layout'];
                let componentFound = false;
                
                for (const name of componentNames) {
                    if (typeof window[name] !== 'undefined') {
                        const ComponentToRender = window[name];
                        root.render(<ComponentToRender />);
                        componentFound = true;
                        break;
                    }
                }
                
                if (!componentFound) {
                    root.render(
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <h1>⚛️ React Component Preview</h1>
                            <p>Define an <code>App</code> component to see it rendered here.</p>
                            <div style={{ background: '#f6f8fa', padding: '20px', borderRadius: '8px', marginTop: '20px', textAlign: 'left' }}>
                                <h3>Example:</h3>
                                <pre style={{ margin: 0 }}>${exampleCode}</pre>
                            </div>
                        </div>
                    );
                }
            }
        } catch (error) {
            console.error('React Error:', error);
            const rootElement = document.getElementById('root');
            const root = ReactDOM.createRoot(rootElement);
            root.render(
                <div className="error">
                    <h3>React Component Error</h3>
                    <p>{error.message}</p>
                    <details>
                        <summary>Stack trace</summary>
                        <pre>{error.stack}</pre>
                    </details>
                </div>
            );
        }
    </script>
</body>
</html>
    `;
  }

  private generatePhpPreview(files: FileNode[], selectedFile: FileNode | null): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>PHP Preview</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .php-code { background: #f8f8f8; padding: 15px; border-left: 4px solid #007cba; }
        .note { background: #fff3cd; padding: 10px; border: 1px solid #ffeaa7; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>PHP Project Preview</h1>
    <div class="note">
        <strong>Note:</strong> PHP requires a server environment to execute. 
        This is a static preview of your PHP code.
    </div>
    <div class="php-code">
        <h3>Current PHP Code:</h3>
        <pre>${selectedFile?.content || 'No PHP file selected'}</pre>
    </div>
    <p>To run PHP code, use the execution panel or deploy to a PHP server.</p>
</body>
</html>
    `;
  }

  private generatePythonWebPreview(files: FileNode[], selectedFile: FileNode | null): string {
    if (this.currentFramework === 'Django' || this.currentFramework === 'Flask') {
      return `
<!DOCTYPE html>
<html>
<head>
    <title>Python Web Framework Preview</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .framework-info { background: #e8f5e8; padding: 15px; border-radius: 8px; }
    </style>
</head>
<body>
    <h1>${this.currentFramework} Project Preview</h1>
    <div class="framework-info">
        <h3>Framework: ${this.currentFramework}</h3>
        <p>This is a ${this.currentFramework} project. To see the full preview:</p>
        <ol>
            <li>Run the development server using the execution panel</li>
            <li>Navigate to the local server URL (typically http://localhost:8000)</li>
        </ol>
    </div>
    <h3>Current Code:</h3>
    <pre style="background: #f5f5f5; padding: 15px;">${selectedFile?.content || 'No Python file selected'}</pre>
</body>
</html>
      `;
    }

    return null;
  }

  private generateGenericWebPreview(files: FileNode[], selectedFile: FileNode | null): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Project Preview</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .preview-container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="preview-container">
        <h1>Project Preview</h1>
        <p>Language: ${this.currentLanguage}</p>
        <p>Framework: ${this.currentFramework}</p>
        <p>This project supports web preview. Add HTML, CSS, or JavaScript files to see live preview.</p>
    </div>
</body>
</html>
    `;
  }

  private findFileByName(files: FileNode[], name: string): FileNode | null {
    for (const file of files) {
      if (file.name === name && file.type === 'file') {
        return file;
      }
      if (file.children) {
        const found = this.findFileByName(file.children, name);
        if (found) return found;
      }
    }
    return null;
  }

  private findFileByExtension(files: FileNode[], extension: string): FileNode | null {
    for (const file of files) {
      if (file.type === 'file' && file.name.endsWith(extension)) {
        return file;
      }
      if (file.children) {
        const found = this.findFileByExtension(file.children, extension);
        if (found) return found;
      }
    }
    return null;
  }

  private findFilesByExtension(files: FileNode[], extension: string): FileNode[] {
    const result: FileNode[] = [];
    
    for (const file of files) {
      if (file.type === 'file' && file.name.endsWith(extension)) {
        result.push(file);
      }
      if (file.children) {
        result.push(...this.findFilesByExtension(file.children, extension));
      }
    }
    
    return result;
  }

  private findMainReactFile(files: FileNode[]): FileNode | null {
    // Look for common React entry files
    const entryNames = ['App.jsx', 'App.js', 'index.jsx', 'index.js', 'main.jsx', 'main.js'];
    
    for (const name of entryNames) {
      const file = this.findFileByName(files, name);
      if (file) return file;
    }
    
    // Fallback to any JSX file
    return this.findFileByExtension(files, '.jsx') || this.findFileByExtension(files, '.js');
  }

  public updatePreview(content: string): void {
    this.previewContent = content;
    if (this.previewFrame) {
      this.previewFrame.srcdoc = content;
    }
  }

  public setPreviewFrame(frame: HTMLIFrameElement): void {
    this.previewFrame = frame;
    if (this.previewContent) {
      frame.srcdoc = this.previewContent;
    }
  }
}

export const webPreviewService = WebPreviewService.getInstance();
